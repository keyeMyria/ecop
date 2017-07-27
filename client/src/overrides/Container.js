/*
 * When preparing items for the container, do not accept items if the user
 * has not permission to access it as indicated by the 'permission' config
 *
 * Note when upgrade ExtJS, this might need to be updated as well to use
 * the code from the new ExtJS version
 */
Ext.define('Ecop.overrides.Container', {
    override: 'Ext.container.Container',

    privates: {
        prepareItems: function(items, applyDefaults) {
            var me = this,
                i = 0,
                item, len, temp = [];

            // Create an Array which does not refer to the passed array.
            // The passed array is a reference to a user's config object and MUST NOT be mutated.
            if (Ext.isArray(items)) {
                items = items.slice();
            } else {
                items = [items];
            }

            for (i = 0; i < items.length; i++) {
                item = items[i];
                if (item.permission===undefined || Ecop.auth.hasPermission(item.permission)) {
                    temp.push(item);
                }
            }
            items = temp;
            len = items.length;

            for (i = 0; i < len; i++) {
                item = items[i];
                if (item == null) {
                    Ext.Array.erase(items, i, 1);
                    --i;
                    --len;
                } else {
                    if (applyDefaults) {
                        item = this.applyDefaults(item);
                    }

                    // Tell the item we're in a container during construction
                    item.$initParent = me;
                    if (item.isComponent) {
                        // When this was passed to us, it's an already constructed component
                        // This is useful to know because we can make decisions regarding the
                        // state of the component if it's newly created
                        item.instancedCmp = true;
                    }
                    items[i] = me.lookupComponent(item);
                    // delete here because item may have been a config, so we don't
                    // want to mutate it
                    delete item.$initParent;
                }
            }

            return items;
        }
    }
});
