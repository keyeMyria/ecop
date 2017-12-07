Building CKEDITOR

The folder ckeditor is not included in the source repository but build online
via the build config file `ckeditor-build-config.js`, which is stored in the
repository.

For any changes to the plugins used, go to the link specified in the file and
change build options and build again.

Then replace the folder `ckeditor` with the downloaded build and move the new
build config file `build-config.js` out of the ckeditor folder into the
current folder as `ckeditor-build-config.js`.
