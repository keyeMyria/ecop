from pyramid.config import Configurator

from hm.lib.config import siteConfig
from weblibs.jsonrpc import jsonRenderer


def main(global_config, **settings):
    """ WSGI entry point """

    for (k, v) in ((key[len('ecop.'):], settings[key]) for key in settings
                   if key.startswith('ecop.')):
        setattr(siteConfig, k, v)
    siteConfig.debug = global_config.get('debug') == 'true'

    config = Configurator(settings=settings)

    config.include('pyramid_session_redis')
    config.include('pyramid_tm')
    config.include('pyramid_chameleon')
    config.include('pyramid_rpc.jsonrpc')

    # configure various components
    config.include('weblibs.sqlalchemy')
    config.include('weblibs.redis')
    config.include('weblibs.elasticsearch')
    config.include('weblibs.oss')
    config.include('weblibs.wepay')
    config.include('weblibs.sms')
    config.include('weblibs.camunda')

    # This tween can only be added after session is also enabled for ecop
    # config.include('weblibs.weixin')

    # tweens are registered below
    # note that tweens toward the bottom are executed first
    config.include('weblibs.devicetype')  # we need this for checking weixin
    config.include('weblibs.clienttype')  # for bot detection
    config.include('weblibs.httpsredirect')
    config.include('weblibs.botblock')

    # configure the json rpc endpoint
    config.add_renderer('myjson', jsonRenderer)
    config.add_jsonrpc_endpoint('rpc', 'rpc', xhr=True,
                                default_renderer='myjson')

    config.add_route('upload', '/upload', request_method='POST')
    config.add_route('erp', '/', xhr=False)
    config.add_route('order_download', '/order/{orderid}.pdf', xhr=False)

    # ikea worktop related
    config.add_route('forms', '/ikea/forms/{processId}/{form}.pdf', xhr=False)
    config.add_route('receivable', '/ikea/receivable/{key}.pdf', xhr=False)
    config.add_route('label', '/ikea/shippingLabel', xhr=False)
    config.add_route('ship', '/ikea/shipOrder', xhr=False)
    config.add_route('worktop', '/ikea', xhr=False)

    config.scan()
    return config.make_wsgi_app()
