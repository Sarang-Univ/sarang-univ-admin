'use client';

import Spreadsheet from '@/components/ui/spreadsheet';
import TestButton from "@/components/ui/test-button";


// spreadsheet test 페이지
export default function SpreadsheetTestPage() {
    const handleSend = (row: any) => {
        alert(`${row.name}에게 전송`);
    };

    return (
        <div style={{ padding: 20 }}>
            <h1>Spreadsheet 컴포넌트 테스트</h1>
            <Spreadsheet
                api="/api/test-sheet"
                renderComponents={{
                    send: TestButton,
                }}
            />
        </div>
    );
}
