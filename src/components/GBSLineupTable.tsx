"use client";

import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
    TableHeader,
    TableHead,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Save, X, Trash2, Search, Download, Filter } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { GenderBadge, TypeBadge } from "@/components/Badge";
import { Input } from "@/components/ui/input";
import { webAxios } from "@/lib/api/axios";
import { useToastStore } from "@/store/toast-store";
import { useConfirmDialogStore } from "@/store/confirm-dialog-store";
import { AxiosError } from "axios";
import { generateScheduleColumns } from "@/utils/retreat-utils";
import {
    COMPLETE_GROUP_ROW_COUNT,
    MEMO_COLORS,
} from "@/lib/constant/lineup.constant";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {mutate} from "swr";

// --- debounce hook ---
function useDebouncedValue<T>(value: T, delay: number) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debounced;
}

// === 최적화 Row ===
const LineupTableRow = memo(function LineupTableRow({
                                                        row,
                                                        idx,
                                                        withNumber,
                                                        scheduleColumns,
                                                        onSaveMemo,
                                                        onDeleteMemo,
                                                        retreatSlug,
                                                    }: {
    row: any;
    idx: number;
    withNumber: any[];
    scheduleColumns: any[];
    onSaveMemo: (id: string, memo: string, color: string) => Promise<void>;
    onDeleteMemo: (id: string) => Promise<void>;
    retreatSlug: string;
}) {
    const [editing, setEditing] = useState(false);
    const [localMemo, setLocalMemo] = useState(row.lineupMemo || "");
    const [localColor, setLocalColor] = useState(row.lineupMemocolor || "");
    const [isMemoLoading, setIsMemoLoading] = useState(false);
    const addToast = useToastStore((s) => s.add);
    const [gbsNumberInputs, setGbsNumberInputs] = useState<Record<string, string>>({});
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

    const handleSaveGbsNumber = async (row: any) => {
        const newGbsNumber = gbsNumberInputs[row.id] ?? String(row.gbsNumber);
        const endpoint = `/api/v1/retreat/${retreatSlug}/line-up/user-lineups`;

        setLoadingStates((prev) => ({ ...prev, [row.id]: true }));

        try {
            await webAxios.post(`/api/v1/retreat/${retreatSlug}/line-up/assign-gbs`, {
                userRetreatRegistrationId: row.id,
                gbsNumber: newGbsNumber,
            });

            addToast({
                title: "성공",
                description: "GBS가 배정되었습니다.",
                variant: "success",
            });

            const updatedData = await mutate(endpoint);
            if (updatedData) {
                const targetGbsNumber = parseInt(newGbsNumber);
                const gbsGroup = updatedData.filter((r: any) => r.gbsNumber === targetGbsNumber);
                if (gbsGroup.length >= 7) {
                    addToast({
                        title: "⚠️ GBS 인원 초과 알림",
                        description: `배정된 GBS 인원이 ${gbsGroup.length}명입니다! 권장 인원을 초과했습니다.`,
                        variant: "warning",
                    });
                }
            }
        } catch (err) {
            console.error(err);
            addToast({
                title: "오류 발생",
                description: "GBS 배정 중 문제가 발생했습니다.",
                variant: "destructive",
            });
        } finally {
            setLoadingStates((prev) => ({ ...prev, [row.id]: false }));
        }
    };

    useEffect(() => {
        setLocalMemo(row.lineupMemo || "");
        setLocalColor(row.lineupMemocolor || "");
    }, [row.lineupMemo, row.lineupMemocolor]);

    const handleSave = async () => {
        setIsMemoLoading(true);
        await onSaveMemo(row.id, localMemo, localColor);
        setIsMemoLoading(false);
        setEditing(false);
    };

    const handleDelete = async () => {
        setIsMemoLoading(true);
        await onDeleteMemo(row.id);
        setIsMemoLoading(false);
        setEditing(false);
    };

    // state
    const [editingScheduleMemo, setEditingScheduleMemo] = useState<Record<string, boolean>>({});
    const [scheduleMemoValues, setScheduleMemoValues] = useState<Record<string, string>>({});

// 일정변동 메모 저장
//     const handleSaveScheduleMemo = async (id: string) => {
//         const memo = scheduleMemoValues[id];
//         if (!memo || !memo.trim()) return;
//         try {
//             await webAxios.post(`/api/v1/retreat/${retreatSlug}/line-up/${id}/schedule-change-memo`, {
//                 memo: memo.trim(),
//             });
//             setEditingScheduleMemo((prev) => ({ ...prev, [id]: false }));
//             addToast({
//                 title: "저장 성공",
//                 description: "일정변동 메모가 저장되었습니다.",
//                 variant: "success",
//             });
//         } catch (err) {
//             console.error(err);
//             addToast({
//                 title: "오류 발생",
//                 description: "일정변동 메모 저장 중 오류가 발생했습니다.",
//                 variant: "destructive",
//             });
//         }
//     };
    const handleSaveScheduleMemo = async (id: string) => {
        // TODO: 일정 변동 요청 메모 추가는 구현이 필요합니다
        alert('일정 변동 요청 메모 추가는 구현이 필요합니다');

        /*
        const memo = scheduleMemoValues[id];

        if (!memo || !memo.trim()) {
          addToast({
            title: "오류",
            description: "메모 내용을 입력해주세요.",
            variant: "destructive",
          });
          return;
        }

        setLoading(id, "schedule_memo", true);

        try {
          await webAxios.post(
            `/api/v1/retreat/${retreatSlug}/line-up/${id}/schedule-change-memo`,
            {
              memo: memo.trim(),
            }
          );

          // 성공 시 데이터 업데이트
          setFilteredData(prev =>
            prev.map(row =>
              row.id === id
                ? {
                    ...row,
                    unresolvedLineupHistoryMemo: memo.trim(),
                  }
                : row
            )
          );
          setData(prev =>
            prev.map(row =>
              row.id === id
                ? {
                    ...row,
                    unresolvedLineupHistoryMemo: memo.trim(),
                  }
                : row
            )
          );

          await mutate(lineupEndpoint);

          setEditingScheduleMemo(prev => ({ ...prev, [id]: false }));
          setScheduleMemoValues(prev => ({ ...prev, [id]: "" }));

          addToast({
            title: "성공",
            description: "일정 변동 메모가 성공적으로 저장되었습니다.",
            variant: "success",
          });
        } catch (error) {
          console.error("일정 변동 메모 저장 중 오류 발생:", error);

          addToast({
            title: "오류 발생",
            description:
              error instanceof AxiosError
                ? error.response?.data?.message || error.message
                : error instanceof Error
                  ? error.message
                  : "일정 변동 메모 저장 중 오류가 발생했습니다.",
            variant: "destructive",
          });
        } finally {
          setLoading(id, "schedule_memo", false);
        }
        */
    };

// 편집 시작/취소
    const handleStartEditScheduleMemo = (id: string, currentMemo: string) => {
        if (currentMemo && currentMemo.trim()) return;
        setEditingScheduleMemo((prev) => ({ ...prev, [id]: true }));
        setScheduleMemoValues((prev) => ({ ...prev, [id]: currentMemo || "" }));
    };
    const handleCancelEditScheduleMemo = (id: string) => {
        setEditingScheduleMemo((prev) => ({ ...prev, [id]: false }));
        setScheduleMemoValues((prev) => ({ ...prev, [id]: "" }));
    };

    // 로딩 상태 설정 함수
    const setLoading = (id: string, action: string, isLoading: boolean) => {
        setLoadingStates(prev => ({
            ...prev,
            [`${id}_${action}`]: isLoading,
        }));
    };

    // 로딩 상태 확인 함수
    const isLoading = (id: string, action: string) => {
        return loadingStates[`${id}_${action}`];
    };


    return (
        <TableRow>
            {idx === 0 && (
                <>
                    <TableCell
                        rowSpan={withNumber.length}
                        className={`align-middle font-bold text-center px-2 py-1 ${
                            withNumber.length > COMPLETE_GROUP_ROW_COUNT ? "bg-rose-200" : ""
                        }`}
                    >
                        {row.gbsNumber}
                    </TableCell>
                    <TableCell
                        rowSpan={withNumber.length}
                        className="align-middle text-center font-semibold px-2 py-1"
                    >
                        전참 {row.fullAttendanceCount}
                        <br />
                        부분참 {row.partialAttendanceCount}
                    </TableCell>
                    <TableCell
                        rowSpan={withNumber.length}
                        className="align-middle text-center font-semibold px-2 py-1"
                    >
                        남 {row.maleCount}
                        <br />
                        여 {row.femaleCount}
                    </TableCell>
                </>
            )}

            <TableCell className={row.isLeader ? "text-center bg-cyan-200 px-2 py-1" : "text-center px-2 py-1"}>
                {row.department}
            </TableCell>
            <TableCell className={row.isLeader ? "text-center bg-cyan-200 px-2 py-1" : "text-center px-2 py-1"}>
                <GenderBadge gender={row.gender} />
            </TableCell>
            <TableCell className={row.isLeader ? "text-center bg-cyan-200 px-2 py-1" : "text-center px-2 py-1"}>
                {row.grade}
            </TableCell>
            <TableCell className={row.isLeader ? "text-center bg-cyan-200 font-bold text-base px-2 py-1" : "text-center px-2 py-1"}>
                {row.name}
            </TableCell>
            <TableCell className={row.isLeader ? "text-center bg-cyan-200 px-2 py-1" : "text-center px-2 py-1"}>
                {row.currentLeader}
            </TableCell>
            <TableCell className={row.isLeader ? "text-center bg-cyan-200 px-2 py-1" : "text-center px-2 py-1"}>
                {row.phoneNumber}
            </TableCell>

            {/* 라인업 메모 */}
            <TableCell
                className={row.isLeader ? "bg-cyan-200 text-center px-2 py-1" : "text-center px-2 py-1"}
                style={{ backgroundColor: localColor }}
            >
                {editing ? (
                    <div className="flex flex-col gap-2 p-1">
                        <Textarea
                            value={localMemo}
                            onChange={e => setLocalMemo(e.target.value)}
                            placeholder="메모를 입력하세요..."
                            className="text-sm resize-none overflow-hidden w-full"
                            style={{
                                height: Math.max(60, Math.min(200, localMemo.split("\n").length * 20 + 20)) + "px",
                            }}
                            rows={Math.max(3, Math.min(10, localMemo.split("\n").length + 1))}
                            disabled={isMemoLoading}
                        />
                        <div className="flex flex-wrap gap-1">
                            {MEMO_COLORS.map(color => {
                                const isSelected =
                                    (color === "transparent" && (localColor === "" || localColor === undefined)) ||
                                    (color !== "transparent" && localColor === color);
                                return (
                                    <button
                                        key={color}
                                        style={{
                                            backgroundColor: color === "transparent" ? "white" : color,
                                            border: isSelected ? "2px solid black" : "1px solid #ccc",
                                        }}
                                        className={`w-5 h-5 rounded-full ${color === "transparent" ? "relative" : ""}`}
                                        onClick={() => setLocalColor(color === "transparent" ? "" : color)}
                                        type="button"
                                    >
                                        {color === "transparent" && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-3 h-0.5 bg-red-500 rotate-45 absolute"></div>
                                                <div className="w-3 h-0.5 bg-red-500 -rotate-45 absolute"></div>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="outline" onClick={handleSave} disabled={isMemoLoading} className="h-7 px-2">
                                {isMemoLoading ? (
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                    <Save className="h-3 w-3" />
                                )}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={isMemoLoading} className="h-7 px-2">
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-start gap-2 p-1">
                        <div
                            className="flex-1 text-sm text-gray-600 cursor-pointer hover:bg-gray-100 p-1 rounded min-h-[24px] whitespace-pre-wrap break-words"
                            onClick={() => setEditing(true)}
                        >
                            {row.lineupMemo || "메모를 추가하려면 클릭하세요"}
                        </div>
                        {row.lineupMemo && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleDelete}
                                disabled={isMemoLoading}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 flex-shrink-0 mt-1"
                            >
                                {isMemoLoading ? (
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                    <Trash2 className="h-3 w-3" />
                                )}
                            </Button>
                        )}
                    </div>
                )}
            </TableCell>

            {/* 타입 */}
            <TableCell className={`text-center px-2 py-1 ${row.isLeader ? "bg-cyan-200" : ""}`}>
                <TypeBadge type={row.type} />
            </TableCell>

            {/* 스케줄 체크박스 */}
            {scheduleColumns.map(col => (
                <TableCell key={`${row.id}-${col.key}`} className={`px-2 py-1 text-center ${row.isLeader ? "bg-cyan-200" : ""}`}>
                    <Checkbox checked={row.schedule[col.key]} disabled className={row.schedule[col.key] ? col.bgColorClass : ""} />
                </TableCell>
            ))}
            <TableCell className="text-center px-2 py-1">
                <input
                    type="text"
                    defaultValue={row.gbsNumber}
                    className="rounded px-2 py-1 text-center w-24 border border-gray-300 bg-white"
                    onClick={(e) => e.currentTarget.select()}
                    onChange={(e) =>
                        setGbsNumberInputs((prev) => ({
                            ...prev,
                            [row.id]: e.target.value,
                        }))
                    }
                    placeholder="번호 입력"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveGbsNumber(row);
                    }}
                    readOnly={false}
                />
            </TableCell>
            {/* ✅ GBS 메모 */}
            {idx === 0 && (
            <TableCell rowSpan={withNumber.length} className="whitespace-pre-wrap text-sm text-gray-600 px-2 py-1">
                {row.gbsMemo}
            </TableCell>
            )}
            {/* GBS 메모 */}

            {/* ✅ 라인업 일정변동 요청 */}
            <TableCell
                className={`align-middle px-2 py-1 ${row.unresolvedLineupHistoryMemo ? "bg-yellow-100" : ""}`}
            >
                {editingScheduleMemo[row.id] ? (
                    /* 일정 변동 메모 편집 UI */
                    <div className="flex flex-col gap-2 p-2">
                        <Textarea
                            value={scheduleMemoValues[row.id] || ""}
                            onChange={e =>
                                setScheduleMemoValues(prev => ({
                                    ...prev,
                                    [row.id]: e.target.value,
                                }))
                            }
                            placeholder="일정 변동 메모를 입력하세요..."
                            className="text-sm resize-none overflow-hidden w-full"
                            style={{
                                height:
                                    Math.max(
                                        60,
                                        Math.min(
                                            200,
                                            (scheduleMemoValues[row.id] || "").split("\n").length * 20 + 20
                                        )
                                    ) + "px",
                            }}
                            disabled={isLoading(row.id, "schedule_memo")}
                            rows={Math.max(
                                3,
                                Math.min(
                                    10,
                                    (scheduleMemoValues[row.id] || "").split("\n").length + 1
                                )
                            )}
                        />
                        <div className="flex gap-1 justify-end">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSaveScheduleMemo(row.id)}
                                disabled={isLoading(row.id, "schedule_memo")}
                                className="h-7 px-2"
                            >
                                {isLoading(row.id, "schedule_memo") ? (
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                    <Save className="h-3 w-3" />
                                )}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCancelEditScheduleMemo(row.id)}
                                disabled={isLoading(row.id, "schedule_memo")}
                                className="h-7 px-2"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-start gap-2 p-2">
                        {row.unresolvedLineupHistoryMemo ? (
                            // 메모가 있는 경우 - 읽기 전용 (수정 불가)
                            <div className="text-sm text-gray-600 whitespace-pre-wrap break-words">
                                {row.unresolvedLineupHistoryMemo}
                            </div>
                        ) : (
                            // 메모가 없는 경우 - 새로 작성 가능
                            <div
                                className="flex-1 text-sm text-gray-600 cursor-pointer hover:bg-gray-100 p-2 rounded min-h-[24px] whitespace-pre-wrap break-words"
                                onClick={() =>
                                    handleStartEditScheduleMemo(
                                        row.id,
                                        row.unresolvedLineupHistoryMemo
                                    )
                                }
                            >
                                {row.unresolvedLineupHistoryMemo ||
                                    "일정 변동 메모를 추가하려면 클릭하세요"}
                            </div>
                        )}
                    </div>
                )}
            </TableCell>

            {/* 관리자 메모 */}
            <TableCell
                className={`align-middle text-center px-2 py-1`}
            >
                <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {row.adminMemo || ""}
                </div>
            </TableCell>
        </TableRow>
    );
});

// === Main Table ===
export const GBSLineupTable = memo(function GBSLineupTable({
                                                               registrations = [],
                                                               schedules = [],
                                                               retreatSlug,
                                                           }: {
    registrations: any[];
    schedules: any[];
    retreatSlug: string;
}) {
    const addToast = useToastStore((state) => state.add);
    const confirmDialog = useConfirmDialogStore();

    const [data, setData] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebouncedValue(searchTerm, 200);
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
    const [selectedSchedules, setSelectedSchedules] = useState<string[]>([]);
    const scheduleColumns = useMemo(() => generateScheduleColumns(schedules), [schedules]);
    const [showOnlyUnassigned, setShowOnlyUnassigned] = useState(false);
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isScheduleFilterModalOpen, setIsScheduleFilterModalOpen] = useState(false);

    const transformedData = useMemo(() => {
        if (!registrations.length || !schedules.length) return [];
        return registrations.map((registration) => {
            const scheduleData: Record<string, boolean> = {};
            schedules.forEach((schedule) => {
                scheduleData[`schedule_${schedule.id}`] =
                    registration.userRetreatRegistrationScheduleIds?.includes(schedule.id) || false;
            });
            return {
                ...registration,
                department: `${registration.univGroupNumber}부`,
                grade: `${registration.gradeNumber}학년`,
                schedule: scheduleData,
            };
        });
    }, [registrations, schedules]);

    useEffect(() => {
        setData(transformedData);
        setFilteredData(transformedData);
    }, [transformedData]);

    // 부서 목록 추출 및 정렬
    const departmentOptions = useMemo(() => {
        const departments = Array.from(new Set(data.map(row => row.department).filter(Boolean)));
        return departments.sort((a, b) => {
            // 숫자 부서 정렬 (1부, 2부, 3부...)
            const aNum = parseInt(a.replace('부', ''));
            const bNum = parseInt(b.replace('부', ''));
            return aNum - bNum;
        });
    }, [data]);

    const filteredDataMemo = useMemo(() => {
        let temp = data;

        // ✅ 1. 미배정 필터
        if (showOnlyUnassigned) {
            temp = temp.filter(
                row => !row.gbsNumber || row.gbsNumber === "" || row.gbsNumber === null
            );
        }

        // ✅ 2. 부서 필터
        if (selectedDepartments.length > 0) {
            temp = temp.filter(row => selectedDepartments.includes(row.department));
        }

        // ✅ 3. 스케줄 필터 (모든 선택 조건 만족하는 사용자만)
        if (selectedSchedules.length > 0) {
            temp = temp.filter(row => {
                return selectedSchedules.every(scheduleKey => row.schedule[scheduleKey] === true);
            });
        }

        // ✅ 4. 검색어 필터 (디바운싱 적용)
        if (debouncedSearchTerm.trim()) {
            const lower = debouncedSearchTerm.toLowerCase();
            temp = temp.filter(
                row =>
                    String(row.gbsNumber ?? "").includes(lower) ||
                    (row.name?.toLowerCase().includes(lower) ?? false) ||
                    (row.lineupMemo?.toLowerCase().includes(lower) ?? false) ||
                    (row.department?.toLowerCase().includes(lower) ?? false) ||
                    (row.grade?.toLowerCase().includes(lower) ?? false) ||
                    (row.type?.toLowerCase().includes(lower) ?? false)
            );
        }

        return temp;
    }, [data, debouncedSearchTerm, showOnlyUnassigned, selectedDepartments, selectedSchedules]);

    useEffect(() => {
        setFilteredData(filteredDataMemo);
    }, [filteredDataMemo]);

    const groupedData = useMemo(() => {
        const group: Record<string, any[]> = {};
        filteredData.forEach((row) => {
            const key = row.gbsNumber?.toString() || "null";
            if (!group[key]) group[key] = [];
            group[key].push(row);
        });
        Object.keys(group).forEach((gbsNumStr) => {
            group[gbsNumStr].sort((a, b) => {
                if (a.isLeader && !b.isLeader) return -1;
                if (!a.isLeader && b.isLeader) return 1;
                if (b.grade !== a.grade) return b.grade - a.grade;
                return a.name.localeCompare(b.name, "ko");
            });
        });
        return group;
    }, [filteredData]);

    const handleSaveMemo = useCallback(
        async (id: string, memo: string, color: string) => {
            const row = filteredData.find((r) => r.id === id);
            const memoId = row?.lineupMemoId;
            try {
                const processedColor = color === "" ? null : color?.trim();
                if ((memo && memo.trim()) || color !== undefined) {
                    if (memoId) {
                        await webAxios.put(`/api/v1/retreat/${retreatSlug}/line-up/${memoId}/lineup-memo`, {
                            memo: memo.trim(),
                            color: processedColor,
                        });
                    } else {
                        await webAxios.post(`/api/v1/retreat/${retreatSlug}/line-up/${id}/lineup-memo`, {
                            memo: memo.trim(),
                            color: processedColor,
                        });
                    }
                }
                setData((prev) => prev.map((r) => (r.id === id ? { ...r, lineupMemo: memo, lineupMemocolor: color } : r)));
                setFilteredData((prev) => prev.map((r) => (r.id === id ? { ...r, lineupMemo: memo, lineupMemocolor: color } : r)));
                addToast({ title: "성공", description: "메모가 저장되었습니다.", variant: "success" });
            } catch (error) {
                addToast({
                    title: "오류 발생",
                    description:
                        error instanceof AxiosError
                            ? error.response?.data?.message || error.message
                            : error instanceof Error
                                ? error.message
                                : "메모 저장 중 오류가 발생했습니다.",
                    variant: "destructive",
                });
            }
        },
        [retreatSlug, filteredData, addToast]
    );

    const handleDeleteMemo = useCallback(
        async (id: string) => {
            const row = filteredData.find((r) => r.id === id);
            const memoId = row?.lineupMemoId;
            try {
                await webAxios.delete(`/api/v1/retreat/${retreatSlug}/line-up/${memoId}/lineup-memo`);
                setData((prev) => prev.map((r) => (r.id === id ? { ...r, lineupMemo: "", lineupMemocolor: "" } : r)));
                setFilteredData((prev) => prev.map((r) => (r.id === id ? { ...r, lineupMemo: "", lineupMemocolor: "" } : r)));
                addToast({ title: "성공", description: "메모가 삭제되었습니다.", variant: "success" });
            } catch (error) {
                addToast({
                    title: "오류 발생",
                    description:
                        error instanceof AxiosError
                            ? error.response?.data?.message || error.message
                            : error instanceof Error
                                ? error.message
                                : "메모 삭제 중 오류가 발생했습니다.",
                    variant: "destructive",
                });
            }
        },
        [retreatSlug, filteredData, addToast]
    );


    return (
        <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between bg-gray-50 border-b">
                <div className="whitespace-nowrap">
                    <CardTitle>GBS 라인업 현황 조회</CardTitle>
                    <CardDescription>대학부 전체 GBS 목록 조회 및 배정</CardDescription>
                </div>
                <div className="flex items-center gap-2 whitespace-nowrap">
                    {/* 엑셀 버튼들 */}
                    {["exportExcel", "exportDepartmentGbsTags", "exportRetreatGbsTags"].map((key, i) => (
                        <Button
                            key={key}
                            variant="outline"
                            size="sm"
                            onClick={() => alert("엑셀 다운로드 기능은 구현이 필요합니다.")}
                            disabled={loadingStates[key]}
                            className="flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors whitespace-nowrap"
                        >
                            {loadingStates[key] ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                                <Download className="h-4 w-4" />
                            )}
                            <span>
                {i === 0
                    ? "엑셀로 내보내기"
                    : i === 1
                        ? "부서 GBS 꼬리표 다운로드"
                        : "수양회 GBS 꼬리표 다운로드"}
              </span>
                        </Button>
                    ))}
                </div>
            </CardHeader>

            <CardContent className="px-1 pt-4">
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder={"GBS번호/부서/학년/이름/타입/메모로 검색 ..."}
                            className="pl-8 pr-4 py-2 border-gray-200 focus:border-gray-300 focus:ring-0"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="rounded-md border overflow-x-auto">
                        <div className="min-w-max max-h-[80vh] overflow-y-auto">
                            <Table className="w-full whitespace-nowrap relative">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead rowSpan={2} className="text-center px-2 py-1">
                                            GBS<br/>번호
                                        </TableHead>
                                        <TableHead rowSpan={2} className="text-center px-2 py-1">
                                            전참/부분참
                                        </TableHead>
                                        <TableHead rowSpan={2} className="text-center px-2 py-1">
                                            남/여
                                        </TableHead>
                                        {/* 이하 기존 컬럼 */}
                                        <TableHead rowSpan={2} className="text-center px-2 py-1">
                                            <div className="flex items-center justify-center gap-1">
                                                <span>부서</span>
                                                <Popover open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 hover:bg-gray-100"
                                                        >
                                                            <Filter className={`h-3 w-3 ${selectedDepartments.length > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-80 p-4" align="start">
                                                        <div className="space-y-4">
                                                            <div>
                                                                <h4 className="font-medium text-sm mb-2">부서 필터</h4>
                                                                <p className="text-xs text-gray-600 mb-3">표시할 부서를 선택하세요.</p>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => setSelectedDepartments([])}
                                                                    className="h-7 px-2 text-xs"
                                                                >
                                                                    전체 해제
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => setSelectedDepartments([...departmentOptions])}
                                                                    className="h-7 px-2 text-xs"
                                                                >
                                                                    전체 선택
                                                                </Button>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                                                {departmentOptions.map(department => (
                                                                    <label key={department} className="flex items-center gap-2 cursor-pointer text-sm">
                                                                        <Checkbox
                                                                            checked={selectedDepartments.includes(department)}
                                                                            onCheckedChange={(checked) => {
                                                                                if (checked) {
                                                                                    setSelectedDepartments(prev => [...prev, department]);
                                                                                } else {
                                                                                    setSelectedDepartments(prev => prev.filter(d => d !== department));
                                                                                }
                                                                            }}
                                                                            className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                                                        />
                                                                        <span className="text-xs text-gray-700">{department}</span>
                                                                    </label>
                                                                ))}
                                                                {departmentOptions.length === 0 && (
                                                                    <span className="text-xs text-gray-500 col-span-2">필터할 부서가 없습니다.</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </TableHead>
                                        <TableHead rowSpan={2} className="text-center px-2 py-1">
                                            성별
                                        </TableHead>
                                        <TableHead rowSpan={2} className="text-center px-2 py-1">
                                            학년
                                        </TableHead>
                                        <TableHead rowSpan={2} className="text-center px-2 py-1">
                                            이름
                                        </TableHead>
                                        <TableHead rowSpan={2} className="text-center px-2 py-1">
                                            부서 리더명
                                        </TableHead>
                                        <TableHead rowSpan={2} className="text-center px-2 py-1">
                                            전화번호
                                        </TableHead>
                                        <TableHead rowSpan={2} className="text-center px-2 py-1">
                                            라인업 메모
                                        </TableHead>
                                        <TableHead
                                            rowSpan={2}
                                            className="text-center whitespace-nowrap px-2 py-1"
                                        >
                                            <span>타입</span>
                                        </TableHead>
                                        <TableHead
                                            colSpan={scheduleColumns.length}
                                            className="whitespace-nowrap px-2 py-1"
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                <span>수양회 신청 일정</span>
                                                <Popover open={isScheduleFilterModalOpen} onOpenChange={setIsScheduleFilterModalOpen}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 hover:bg-gray-100"
                                                        >
                                                            <Filter className={`h-3 w-3 ${selectedSchedules.length > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-80 p-4" align="start">
                                                        <div className="space-y-4">
                                                            <div>
                                                                <h4 className="font-medium text-sm mb-2">스케줄 필터</h4>
                                                                <p className="text-xs text-gray-600 mb-3">표시할 스케줄을 선택하세요.</p>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => setSelectedSchedules([])}
                                                                    className="h-7 px-2 text-xs"
                                                                >
                                                                    전체 해제
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => setSelectedSchedules(scheduleColumns.map(col => col.key))}
                                                                    className="h-7 px-2 text-xs"
                                                                >
                                                                    전체 선택
                                                                </Button>
                                                            </div>
                                                            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                                                                {scheduleColumns.map(schedule => (
                                                                    <label key={schedule.key} className="flex items-center gap-2 cursor-pointer text-sm">
                                                                        <Checkbox
                                                                            checked={selectedSchedules.includes(schedule.key)}
                                                                            onCheckedChange={(checked) => {
                                                                                if (checked) {
                                                                                    setSelectedSchedules(prev => [...prev, schedule.key]);
                                                                                } else {
                                                                                    setSelectedSchedules(prev => prev.filter(s => s !== schedule.key));
                                                                                }
                                                                            }}
                                                                            className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                                                        />
                                                                        <span className="text-xs text-gray-700">{schedule.label}</span>
                                                                    </label>
                                                                ))}
                                                                {scheduleColumns.length === 0 && (
                                                                    <span className="text-xs text-gray-500">필터할 스케줄이 없습니다.</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-center px-2 py-1">
                                            GBS 배정하기
                                        </TableHead>
                                        <TableHead rowSpan={2} className="text-center px-2 py-1">
                                            GBS 메모
                                        </TableHead>
                                        <TableHead rowSpan={2} className="text-center px-2 py-1">
                                            라인업<br/>일정변동 요청
                                        </TableHead>
                                        <TableHead rowSpan={2} className="text-center px-2 py-1">
                                            행정간사<br/>메모
                                        </TableHead>
                                    </TableRow>
                                    <TableRow>
                                        {scheduleColumns.map(scheduleCol => (
                                            <TableHead
                                                key={scheduleCol.key}
                                                className="px-2 py-1 text-center whitespace-nowrap"
                                            >
                                                <span className="text-xs">{scheduleCol.label}</span>
                                            </TableHead>
                                        ))}
                                        <TableHead className="px-2 py-1">
                                            <div className="flex items-center justify-center gap-2">
                          <span className="text-xs text-gray-600">
                            미배정만 조회
                          </span>
                                                <Checkbox
                                                    checked={showOnlyUnassigned}
                                                    onCheckedChange={() =>
                                                        setShowOnlyUnassigned(prev => !prev)
                                                    }
                                                    className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                                />
                                            </div>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.entries(groupedData).flatMap(([gbsNum, groupRows]) =>
                                        groupRows.map((row, idx) => (
                                            <LineupTableRow
                                                key={row.id}
                                                row={row}
                                                idx={idx}
                                                withNumber={groupRows}
                                                scheduleColumns={scheduleColumns}
                                                onSaveMemo={handleSaveMemo}
                                                onDeleteMemo={handleDeleteMemo}
                                                retreatSlug={retreatSlug}
                                            />
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});

