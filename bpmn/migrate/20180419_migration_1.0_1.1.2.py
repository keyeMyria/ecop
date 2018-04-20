"""
Change history from 1.0 to 1.1.2:

 * Add start variable IsMeasurementRequested to allow for processes without
   the measurement step
 * Add task UpdateDrawing

The added variable IsMeasurementRequested was manually added to all running
instances prior to the migration and hence not to be dealt with.

Otherwise the process change is minimal and we can use auto-generated migration
plan for the migration.
"""

import argparse
import configparser

from pkg_resources import resource_filename
from weblibs.camunda import parseConfig, camundaClient as cc


SOURCE_ID = 'worktop:2:2ac70ed1-33d1-11e8-8a21-0242ac110005'
TARGET_ID = 'worktop:6:77c577a6-3bb1-11e8-8a21-0242ac110005'


def do_main():
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
