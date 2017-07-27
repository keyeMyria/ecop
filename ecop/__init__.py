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
    config.include('pyramid_tm')
    config.include('pyramid_rpc.jsonrpc')
    config.include('pyramid_chameleon')

    # configure various components
    config.include('weblibs.sqlalchemy')
    config.include('weblibs.redis')
    config.include('weblibs.rabbitmq')
    config.include('weblibs.elasticsearch')
    config.include('weblibs.oss')
    config.include('weblibs.weixin')

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

    config.add_route('health_check', '/rpc', request_method='HEAD')
    config.add_route('upload', '/upload', request_method='POST')
    config.add_route('mecop', '/mecop')
    config.add_route('decop', '/')
    config.add_route('order_download', '/order/{orderid}.pdf', xhr=False)
    config.add_route('shipment_doc', '/shipment_doc/{shipmentid}.pdf',
                     xhr=False)

    # the below are deprecated as of April 17, 2017
    # config.add_route('labelPrint', '/labelPrint', request_method='GET')
    # config.add_route('itemqr', '/itemqr', request_method='GET')

    config.scan()
    return config.make_wsgi_app()
