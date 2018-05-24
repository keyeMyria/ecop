__roles__ = {
    'installer': {
        'tasks': [
            'TakeMeasurement',
            'ConfirmInstallationDate',
            'InstallWorktop']
    },
    'factory': {
        'tasks': [
            'CheckDrawing',
            'UpdateDrawing']
    },
    'ikea_store': {
    },
    'ikea_iscs': {
    },
    'admin': {
    },
    'office': {
        'tasks': [
            'ConfirmMeasurementDate',
            'MakeDrawing',
            'CompleteERPOrder']
    }
}


def hasRole(user, role):
    """ if the user has the given role """
    return role in getUserRoles(user)


def getUserRoles(user):
    """ Return a list of roles the user has """
    roles = user.extraData['worktop']['role']
    if not isinstance(roles, list):
        roles = [roles]
    return roles


def getUserTasks(user):
    """ Return a list of task names the user is allowed to process """
    tasks = []

    for role in getUserRoles(user):
        tasks.extend(__roles__[role].get('tasks', ()))

    return list(set(tasks))
