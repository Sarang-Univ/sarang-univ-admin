import { NextResponse } from 'next/server';

// 테스트용 api (데이터를 아래와 같이 받는다고 가정)
export async function GET() {
    const data = [
        { id: 1, name: '테스트1', age: 23, send: '' },
        { id: 2, name: '테스트2', age: 35, send: '' },
        { id: 3, name: '테스트3', age: 29, send: '' },
    ];

    return NextResponse.json(data);
}
