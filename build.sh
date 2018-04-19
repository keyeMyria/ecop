#
# Build the website app, desktop and mobile application for production
#
# run the script under the same directory ./build.sh
# The built files will be copied under the build directory:
#
# build
# ├── ecop
# │   ├── hm.lib
# │   ├── webmodel
# │   ├── weblibs
# │   └── ecop
# └─asset
#     ├── erp
#     └── worktop

PY_MODULE_BASE=/home/hong/workspace

rm -fr build
mkdir -p build/ecop build/asset/erp build/asset/worktop

# For the in-house developed python package we copy from the local workspace.
# So be sure to build from a clean release branch.
rsync -rv --filter '. rsync.rule' $PY_MODULE_BASE/hm.lib build/ecop
rsync -rv --filter '. rsync.rule' $PY_MODULE_BASE/web/weblibs build/ecop
rsync -rv --filter '. rsync.rule' $PY_MODULE_BASE/web/webmodel build/ecop
rsync -rv --filter '. rsync.rule' . build/ecop/ecop

# Now we start to build Sencha products

echo "##################   Building ERP Client   ##########################"
rm -fr erp/build/production
cd erp/desktop
sencha app build production
cd ../..
cp erp/build/production/app.js build/asset/erp
cp -r erp/build/production/resources build/asset/erp
cp -r erp/desktop/lib build/asset/erp


# build worktop
cd worktop
rm -fr build
npm run build
cd ..
cp -r worktop/build/* build/asset/worktop
