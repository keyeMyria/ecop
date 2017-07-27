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
#     └─mecop

PY_MODULE_BASE=/home/hong/workspace/web

rm -fr build
mkdir -p build/ecop build/asset

cd build/asset
mkdir ecop mecop
cd ../..

# for hm.lib we use the latest master of git repository
curl https://hongyuan:gfdmonster@bitbucket.org/hongyuan/hm.lib/get/master.tar.gz -o hm.lib.tar.gz
mkdir build/ecop/hm.lib
tar xzf hm.lib.tar.gz -C build/ecop/hm.lib --strip-components=1
rm -f *.tar.gz

# For the web python package we copy from the local workspace.
# So be sure to build from a clean release branch.
rsync -rv --filter '. rsync.rule' $PY_MODULE_BASE/weblibs build/ecop
rsync -rv --filter '. rsync.rule' $PY_MODULE_BASE/webmodel build/ecop
rsync -rv --filter '. rsync.rule' . build/ecop/ecop

# Now we start to build Sencha products

echo "##################   Building Ecop Client   ##########################"
rm -fr client/build/production
cd client
sencha app build production
cd ..
cp client/build/production/app.js build/asset/ecop
cp -r client/build/production/resources build/asset/ecop
cp -r client/lib build/asset/ecop
