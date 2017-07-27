Ext.define('Ecop.view.category.CategoryController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.category',

    /*
     *
     * Records all modifications to the category structure for batch update
     * when save button is pressed. See documentation of category.update
     * method for detailed structure of this variable.
     *
     * NOTE: only one user shall be changing the category structure at any one
     * time! And this is not guaranteed by program.
     */
    modified: [],

    /*
     * When first initialized, do not enable node move
     */
    onAfterRender: function () {
        this.getView().getView().plugins[0].dragZone.lock();
    },

    onEditCatLabel: function () {
        var me = this, tree = me.getView(),
            rec = tree.getSelectionModel().getSelection()[0];

        Ext.Msg.prompt(rec.get('text'), '分类名称修改为:', function (btnId, text) {
            text = text.trim();
            if (btnId === 'ok' && rec.get('text') !== text) {
                me.modified.push(['L', rec.getId(), text]);
                rec.set('text', text);
            }
        });
    },

    onCancelCatEdit: function () {
        var me = this, tree = me.getView();

        if (Ext.isEmpty(me.modified)) {
            Ext.Msg.alert(' ', '当前商品结构没有变化');
        } else {
            Ext.Msg.confirm('放弃', '请确认放弃对商品结构所做的全部更改！', function (btnId) {
                if (btnId == 'yes') {
                    tree.store.reload();
                    me.modified = [];
                }
            });
        }
    },

    onSaveCatEdit: function () {
        var me = this, tree = me.getView();

        if (Ext.isEmpty(me.modified)) {
            Ext.Msg.alert(' ', '当前商品结构没有变化');
            return;
        }

        Web.data.JsonRPC.request({
            method: 'category.update',
            params: [me.modified],
            success: function (items) {
                tree.store.reload();
                me.modified = [];
                Ext.Msg.alert(' ', '商品结构修改成功。');
            }
        });
    },

    doAddCat: function (rec, pos, msg) {
        var me = this, newNode, parent, prevCat;

        Ext.Msg.prompt('添加分类', msg, function (btnId, text) {
            text = text.trim();
            if (btnId === 'ok' && text) {
                newNode = {id: Ext.id(), text: text, leaf: true, num: 0};

                switch (pos) {
                    case 'after':
                        parent = rec.parentNode.getId();
                        prevCat = rec.getId();
                        rec.parentNode.insertBefore(newNode, rec.nextSibling);
                        break;
                    case 'append':
                        parent = rec.getId();
                        prevCat = rec.lastChild ? rec.lastChild.getId() : null;
                        rec.appendChild(newNode);
                }
                me.modified.push(['A', newNode.id, parent, prevCat, text]);
            }
        });
    },

    onAddCat: function () {
        var me = this, tree = me.getView(), msg,
            rec = tree.getSelectionModel().getSelection()[0],
            pos = rec.hasChildNodes() && !rec.isExpanded() ? 'after' : 'append';

        if (pos == 'after') {
            msg = '在当前分类"' + rec.get('text') + '"之后添加同级新分类:';
            me.doAddCat(rec, pos, msg);
        } else {
            msg = '在当前分类"' + rec.get('text') + '"之下添加子分类:';
            if (rec.isLeaf() && typeof rec.getId() === 'number') {
                Web.data.JsonRPC.request({
                    method: 'item.search',
                    params: {catId: rec.getId(), status: 'all'},
                    success: function (items) {
                        if (items.length > 0) {
                            Ext.Msg.alert(' ',
                                '分类"' + rec.get('text') + '"下尚有商品，无法在该分类下创建新分类。'
                            );
                        } else {
                            me.doAddCat(rec, pos, msg);
                        }
                    }
                });
            } else {
                me.doAddCat(rec, pos, msg);
            }
        }
    },

    onDeleteCat: function () {
        var me = this, tree = me.getView(),
            rec = tree.getSelectionModel().getSelection()[0],
            msg = '请确认删除分类"' + rec.get('text') + (rec.hasChildNodes() ? '"及全部子分类！' : '"！');

        Ext.Msg.confirm('删除分类', msg, function (btnId) {
            if (btnId == 'yes') {
                me.modified.push(['D', rec.getId()]);
                rec.remove();
            }
        });
    },

    onMoveCat: function (node, data, overModel, dropPosition) {
        var me = this, rec = data.records[0], parent, prevCat;
        switch (dropPosition) {
            case 'before':
                parent = overModel.parentNode.getId();
                prevCat = rec.previousSibling ? rec.previousSibling.getId() : null;
                break;
            case 'after':
                parent = overModel.parentNode.getId();
                prevCat = overModel.getId();
                break;
            case 'append':
                parent = overModel.getId();
                prevCat = rec.previousSibling ? rec.previousSibling.getId() : null;
        }
        me.modified.push(['M', rec.getId(), parent, prevCat]);
    },

    /*
     * Ensure that if a node is converted from leaf node to non-leaf node by
     * moving another category into it, it must not already contain any items.
     * Otherwise those items will become orphanized.
     */
    beforeMoveCat: function(node, data, overModel, dropPosition, dropHandlers) {
        if (dropPosition === 'append' && overModel.isLeaf() && typeof overModel.getId() === 'number') {
            dropHandlers.wait = true;

            Web.data.JsonRPC.request({
                method: 'item.search',
                params: {catId: overModel.getId()},
                success: function (items) {
                    if (items.length > 0) {
                        dropHandlers.cancelDrop();
                        Ecop.util.Util.showError(
                            '分类"' + overModel.get('text') + '"下尚有商品，无法在该分类下创建新分类。'
                        );
                    } else {
                        dropHandlers.processDrop();
                    }
                }
            });
        }
    }
});