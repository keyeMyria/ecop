This package handles all JSON-rpc calls from ecop and supplier portal.

Note that this package has nothing to do with jsonrpc calls from the homemaster
web site and mobile app, although some of the apis might look similar or even
identical. Those for the web site are served under the same domain as the site
and is part of the website package.

The API is designed with the possibility to be later opened to external parties
as open API.


Authentication
==============

User authentication is implemented using a authentication token, which is
returned to the client javascript code, and shall be included on every
subsequent request to the rpc server.

The authentication token is sent to the server via customer http header
Authenticity-Token and not in the json-rpc parameters so as not to interfere
with passing arguments.

All json-rpc method shall require authentication except for the auth.login
method. Before this method is successfully returned, not other method shall
proceeds. To implement this, all method shall be subclassed from
session.RpcBase class, which inspects the request header for an authentication
token.

Once verified, the user associated with the token is placed on the request
object as `request.user`. This is to be used for authorization later.


Session
=======

** No session is used. **

Every API invocation is independent of the others, there is no session support
in the package. Cookies are not used in either request or response for session.
Only the authentication ticket can be used to correlate multiple calls.


CORS
====

*Note:* this section may no longer apply is subject to verification

All API's are intended to be accessed under http://erp.homemaster.cn/rpc, while
the web applications it supports, like ecop, are served under
http://erp.homemaster.cn/ecop, since some of the external depencies
they use, primarily wechat, are not friendly to multiple domain names. Ecop
uses weblibs.cors to supports CORS for this to work.


Permission
==========

Permission is not enfoced on the server side yet. All the server do now is to
send the client, after successful user login, the user's permission under the
'permission' key of the user object.

The following permissions are in active use:

item.manage
item.inactivate
item.create
item.qrcode
item.update.category
item.update.maintainer
item.update.price.purchase
item.bom.manage

order.manage
shop.manage
content.manage
shipment.manage
article.delete
