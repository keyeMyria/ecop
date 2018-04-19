"""
Before 2018.04.17 the ERP orderId field is only recored as the businessKey of
a process instance. It is however difficult to get the orderId in most REST
api calls. So from 4.17 the orderId is also recorded as a process instance
variable when a worktop process is started.

This script add the orderId field for all exising **active** process instances
that are created before the date. For completed or cancelled process instances,
no variables can be added any more.

This script can be safely run repeately without much harm.
"""

import argparse
import configparser

from pkg_resources import resource_filename
from weblibs.camunda import parseConfig, camundaClient as cc


def do_main():
    ret = cc.makeRequest('/process-instance', 'post',
                         {'processDefinitionKey': 'worktop'})
    for p in ret:
        cc.makeRequest(
            f'/process-instance/{p["id"]}/variables/orderId', 'put', params={
                'value': int(p['businessKey']),
                'type': 'Integer'
            }
        )


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-d', dest='debug', action='store_const',
                        const=True, default=False, help='Run in debug mode')
    args = parser.parse_args()

    config = configparser.ConfigParser()
    config.read(resource_filename(
        'ecop', '../%s' % ('debug.ini' if args.debug else '../deploy.ini')))
    parseConfig(config['app:main'])

    do_main()
