const vscode = require('vscode');
const http = require('http');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	const getPortConfig = () => {
		const config = vscode.workspace.getConfiguration('vscode-luogu-api');
		const port = config.get('port', 8080);
		if (!Number.isInteger(port) || port < 1 || port > 65535) {
			vscode.window.showWarningMessage(`vscode-luogu-api: The port number ${port} is invalid, and the default value 8080 has been automatically used`);
			return 8080;
		}
		return port;
	};
	const server = http.createServer((req, res) => {
		res.writeHead(200, { 'Content-Type': 'application/json' });
		if (req.url.startsWith('/problem/')) {
			const pathParts = req.url.replace('/problem/', '').split('/');
			const params = {};
			if (pathParts[0]) {
				params.pid = pathParts[0];
			}
			if (pathParts[1]) {
				params.cid = pathParts[1];
			}
			if (params.pid) {
				vscode.commands.executeCommand('luogu.searchProblem', params);
				res.end(JSON.stringify({
					status: 'OK',
					pid: params.pid,
					cid: params.cid || null
				}));
				return;
			}
		}
		if (req.url.startsWith('/contest/')) {
			const pathParts = req.url.replace('/contest/', '').split('/');
			const params = {};
			if (pathParts[0]) {
				params.cid = pathParts[0];
			}
			if (params.cid) {
				vscode.commands.executeCommand('luogu.contest', params.cid);
				res.end(JSON.stringify({
					status: 'OK',
					cid: params.cid
				}));
				return;
			}
		}
		res.end(JSON.stringify({
			status: 'FAIL'
		}));
	});
	const port = getPortConfig();
	server.listen(port, () => {
		vscode.window.showInformationMessage(`vscode-luogu-api: Server is running on http://localhost:${port}`);
	});
	const configChangeListener = vscode.workspace.onDidChangeConfiguration((e) => {
		if (e.affectsConfiguration('vscode-luogu-api.port')) {
			const newPort = getPortConfig();
			vscode.window.showInformationMessage(`vscode-luogu-api: The port number has been updated to ${newPort}`);
			server.close();
			server.listen(newPort, () => {
				vscode.window.showInformationMessage(`vscode-luogu-api: Server is running on http://localhost:${newPort}`)
			})
		}
	});
	context.subscriptions.push(configChangeListener);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
