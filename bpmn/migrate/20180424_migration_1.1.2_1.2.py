"""
Key Changes from 1.1.2 to 1.2:

 * Add task CompleteERPOrder
 * Add signal event WorktopReceived
 * Set due date of task ConfirmInstallationDate as 1 day after the
   WorktopReceived signal
 * Add task listeners on the measurement and installation tasks to automatically
   set actualMeasurementDate and actualInstallationDate
 * Add execution listerners on signal events WorktopShipped and WorktopReceived
   to record variables shippingDate and receivingDate

Before migration, we add actualMeasurementDate and shippingDate to relavant
active processes.

The process migration is straight-forward one-to-one mapping and we are using
the auto-generated plan.
"""

import argparse
import configparser

from pkg_resources import resource_filename
from weblibs.camunda import parseConfig, camundaClient as cc


SOURCE_ID = 'worktop:6:77c577a6-3bb1-11e8-8a21-0242ac110005'
TARGET_ID = 'worktop:7:27da454d-477d-11e8-8d65-0242ac110005'


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
    For **active** process instances of the last version, add the variables:
        actualMeasurementDate
        shippingDate

    We do not add actualInstallationDate since those process instances are
    already completed.
    """
    # get a list of all active processIds, since we can not put variable on
    # already completed process instances
    processes = [p['id'] for p in cc.makeRequest('/process-instance', 'post', {
        'processDefinitionKey': 'worktop'
    })]

    for (activity, var) in (
        ('TakeMeasurement', 'actualMeasurementDate'),
            ('WorktopShipped', 'shippingDate'), ):

        for act in [a for a in cc.makeRequest(
            '/history/activity-instance', 'post', {
                'processDefinitionKey': 'worktop',
                'activityId': activity,
                'finished': True
            }
        ) if not a['canceled']]:
            if act['processInstanceId'] in processes:
                cc.makeRequest(
                    f'/process-instance/{act["processInstanceId"]}'
                    f'/variables/{var}',
                    'put', params={
                        'value': act['endTime'],
                        'type': 'Date'
                    })


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
