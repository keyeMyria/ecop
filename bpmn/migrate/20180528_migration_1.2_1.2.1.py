"""
Key Changes from 1.2 to 1.2.1:

 * Remove Candidate Groups attribute from all tasks since we no longer depend
   on this task property for assigning tasks
 * Move task ConfirmInstallationDate to lane installer
 * Add process variable isInstallationRequested
 * Change task name ConfirmInstallationDate and InstallWorktop to be compatible
   with delivery only orders

None of the changes affect existing process and no task or flow is added. So
the process migration is straight-forward one-to-one mapping and we are using
the auto-generated plan.

Before migration, we set variable isInstallationRequested to true for all active
processes.
"""

import argparse
import configparser

from pkg_resources import resource_filename
from weblibs.camunda import parseConfig, camundaClient as cc


SOURCE_ID = 'worktop:7:27da454d-477d-11e8-8d65-0242ac110005'
TARGET_ID = 'worktop:8:78c9befc-6260-11e8-a834-0242ac110005'

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


def add_variables():
    """
    For **active** process instances of the last version set the variable
    isInstallationRequested to 'true'.
    """
    # get a list of all active processIds, since we can not put variable on
    # already completed process instances
    processes = [p['id'] for p in cc.makeRequest('/process-instance', 'post', {
        'processDefinitionKey': 'worktop'
    })]

    for pid in processes:
        cc.makeRequest(
            f'/process-instance/{pid}/variables/isInstallationRequested', 'put',
            params={
                'value': 'true',
                'type': 'Boolean'
            }
        )

def do_main():
    add_variables()
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
