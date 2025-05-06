'use client';

// spreadsheet 에서 셀에 들어갈 테스트 컴포넌트 ((셀에 있는 데이터 활용 가능))
export default function TestButton({ rowData }: { rowData: any }) {
    return (
        <button
            onClick={() => alert(`${rowData.name}에게 전송`)}
            className="text-blue-500 hover:underline"
        >
            📨 test전송
        </button>
    );
}
