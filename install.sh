root_path=${PWD}
cd $root_path/gui && npm install 
cd $root_path/core && npm install 
cd $root_path/binary && npm install 
cd $root_path/extensions/vscode && npm install 
cd $root_path/core && npm run build:npm
cp $root_path/package-bak/autoopenai-package.json $root_path/extensions/vscode/package.json
# cp $root_path/package-bak/enflame-package.json $root_path/extensions/vscode/package.json
cd $root_path/extensions/vscode && npm run tsc && npm run e2e:build
cp $root_path/package-bak/autoopenai-package.json $root_path/extensions/vscode/package.json