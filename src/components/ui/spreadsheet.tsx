// ✅ components/ui/spreadsheet.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';
import { registerAllModules } from 'handsontable/registry';
import TestButton from './testButton';
import { customRenderer} from './customRenderer';

registerAllModules();

/*
* spreadsheet 에서 사용할 props
* 1. 데이터 호출할 api end-point
* 2. 셀에 적용할 컴포넌트들 (key : components)
* */
interface SpreadsheetProps {
    api: string;
    renderComponents?: {
        [columnKey: string]: React.ComponentType<{ rowData: any }>;
    };
}

export default function Spreadsheet({ api, renderComponents  }: SpreadsheetProps) {
    const hotRef = useRef<Handsontable | null>(null);
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(api);
                const json = await res.json();
                setData(json);
            } catch (e) {
                console.error('데이터 로드 실패:', e);
            }
        };
        fetchData();
    }, [api]);

    const handleDownload = async () => {
        try {
            const res = await fetch('/api/export-sheet', {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!res.ok) throw new Error('파일 생성 실패');

            const { downloadUrl } = await res.json();
            window.open(downloadUrl, '_blank');
        } catch (err) {
            console.error('다운로드 실패', err);
            alert('파일 생성에 실패했습니다.');
        }
    };

    const columns = [
        { data: 'id', readOnly: true },
        { data: 'name' },
        { data: 'age', readOnly: true },
        {
            data: 'send',
            renderer: renderComponents?.send && customRenderer(renderComponents.send)
        },
    ];

    return (
        <div>
            <button onClick={handleDownload} style={{ marginBottom: '10px' }}>
                엑셀 다운로드 요청
            </button>

            <HotTable
                ref={(ref: any) => {
                    hotRef.current = ref?.hotInstance ?? null;
                }}
                data={data}
                colHeaders={['ID', '이름', '나이', '전송']}
                rowHeaders={true}
                columns={columns}
                manualColumnMove={true}
                filters={true}
                columnSorting={true}
                dropdownMenu={{
                    items: [
                        'filter_by_condition',
                        'filter_by_value',
                        'filter_action_bar',
                        'separator',
                        'sort_asc',
                        'sort_desc',
                        'remove_row',
                    ],
                } as any}
                licenseKey="non-commercial-and-evaluation"
                width="100%"
                height="auto"
            />
        </div>
    );
}
