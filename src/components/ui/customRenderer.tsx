import Handsontable from 'handsontable';
import { createRoot } from 'react-dom/client';
import React from 'react';

// 컴포넌트를 인자로 받아서 렌더러 함수 반환 (( 컴포넌트 렌더링 함수 - 공통))
export const customRenderer = (
    Component?: React.ComponentType<{ rowData: any }>
) => {
    return (
        instance: Handsontable.Core,
        td: HTMLTableCellElement,
        row: number,
        col: number,
        prop: string | number,
        value: any,
        cellProperties: Handsontable.CellProperties
    ) => {
        while (td.firstChild) {
            td.removeChild(td.firstChild);
        }

        if (!Component) return;

        const rowData = instance.getSourceDataAtRow(row);
        const container = document.createElement('div');
        td.appendChild(container);

        const root = createRoot(container);
        root.render(<Component rowData={rowData} />);
    };
};
