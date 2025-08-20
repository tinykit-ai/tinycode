export const withinRoot = (path: string): boolean => {
	const normalizedPath = path.replace(/\\/g, '/').replace(/\/$/, '');
	const cwd = process.cwd().replace(/\\/g, '/').replace(/\/$/, '');
	return normalizedPath.startsWith(cwd);
};