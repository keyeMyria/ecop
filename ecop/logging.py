import logging

from pyramid_rpc.jsonrpc import jsonrpc_method

from .base import RpcBase

logger = logging.getLogger(__name__)


class LoggingRPC(RpcBase):
    @jsonrpc_method(endpoint='rpc', method='site.log')
    def log(self, message):
        if isinstance(message, dict):
            logger.error(message)
        else:
            logger.info(message)
