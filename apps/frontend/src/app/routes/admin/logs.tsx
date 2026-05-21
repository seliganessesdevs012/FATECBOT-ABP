import LogTable from '../../../features/admin/components/LogTable';

export default function AdminLogsPage() {
	return (
		<div className="p-4">
			<h1 className="text-2xl font-semibold mb-4">Logs da sessão</h1>
			<LogTable />
		</div>
	);
}
