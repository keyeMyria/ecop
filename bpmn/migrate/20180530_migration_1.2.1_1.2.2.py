"""
Key Changes from 1.2.1 to 1.2.2:

 * Use groovy task listerners on tasks ConfirmMeasurementDate and InstallWorktop
   for setting the task due. This is to support scheduledMeasurementDate in
   the past
"""

import argparse
import configparser

from pkg_resources import resource_filename
from weblibs.camunda import parseConfig, camundaClient as cc

SOURCE_ID = 'worktop:8:78c9befc-6260-11e8-a834-0242ac110005'
TARGET_ID = 'worktop:9:b50a92c4-63cb-11e8-a834-0242ac110005'

def migrate_process():
    plan = cc.makeRequest('/migration/generate', 'post', params={
        'sourceProcessDefinitionId': SOURCE_ID,
        'targetProcessDefinitionId': TARGET_ID
    })
    cc.makeRequest('/migration/execute', 'post', params={
        "skipCustomListeners": True,
        "processInstanceQuery": {
            "processDefinitionId": SOURCE_ID
        },
        "migrationPlan": plan
    })


def do_main():
    migrate_process()


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
