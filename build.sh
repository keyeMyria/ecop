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
#     └─ecop

PY_MODULE_BASE=/home/hong/workspace/web

rm -fr build
mkdir -p build/ecop build/asset/ecop

# for hm.lib we use the latest master of git repository
wget https://github.com/hongyuan1306/hm.lib/archive/master.zip
unzip master.zip
mkdir build/ecop/hm.lib
cp -r hm.lib-master/* build/ecop/hm.lib
rm -fr *.zip hm.lib-master

# For the web python package we copy from the local workspace.
# So be sure to build from a clean release branch.
rsync -rv --filter '. rsync.rule' $PY_MODULE_BASE/weblibs build/ecop
rsync -rv --filter '. rsync.rule' $PY_MODULE_BASE/webmodel build/ecop
rsync -rv --filter '. rsync.rule' . build/ecop/ecop

# Now we start to build Sencha products

echo "##################   Building Ecop Client   ##########################"
rm -fr client/build/production
cd client/desktop
sencha app build production
cd ../..
cp client/build/production/app.js build/asset/ecop
cp -r client/build/production/resources build/asset/ecop
cp -r client/desktop/lib build/asset/ecop
