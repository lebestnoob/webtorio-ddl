// From https://stackoverflow.com/questions/53782603/how-to-covert-json-into-tree-like-folder-structure-in-javascript
export default function toTree(files = []) {
    const root = {};
    // Create structure where folder name is also a key in parent object
    for (const {path, length} of files) {
        path.match(/[^\\\\]+/g).reduce((acc, folder) => {
            if (!acc.folders) acc.folders = {};
            return acc.folders[folder] || (acc.folders[folder] = { path: folder, length: null }); 
        }, root).length = length;
    }
    // Optional: replace folders object by folders array, recursively
    (function recurse(node) {
        if (!node.folders) return;
        node.folders = Object.values(node.folders);
        node.folders.forEach(recurse);
    })(root);
    return root;
}