"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableHeader,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Save, X, Trash2, Search, Download, Filter, User, UserPlus, Shield, GraduationCap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { GenderBadge } from "@/components/Badge";
import { webAxios } from "@/lib/api/axios";
import { useToastStore } from "@/store/toast-store";
import { useConfirmDialogStore } from "@/store/confirm-dialog-store";
import { mutate } from "swr";
import { AxiosError } from "axios";
import { generateScheduleColumns } from "@/utils/retreat-utils";
import {
  COMPLETE_GROUP_ROW_COUNT,
  MEMO_COLORS,
} from "@/lib/constant/lineup.constant";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/utils/formatDate";
import { UserRetreatRegistrationType } from "@/types";
import { IUserRetreatGBSLineup } from "@/hooks/use-gbs-line-up";

const OptimizedTextarea = React.memo(function OptimizedTextarea({
                                                                  rowId,
                                                                  value,
                                                                  onValueChange,
                                                                  placeholder,
                                                                  className,
                                                                  disabled,
                                                                }: {
  rowId: string;
  value: string;
  onValueChange: (id: string, value: string) => void;
  placeholder: string;
  className: string;
  disabled: boolean;
}) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalValue(e.target.value);
    onValueChange(rowId, e.target.value);
  };

  const textareaStyle = useMemo(
      () => ({
        height:
            Math.max(
                60,
                Math.min(200, localValue.split("\n").length * 20 + 20)
            ) + "px",
      }),
      [localValue]
  );

  const rows = useMemo(
      () =>
          Math.max(
              3,
              Math.min(10, localValue.split("\n").length + 1)
          ),
      [localValue]
  );

  return (
      <Textarea
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={className}
          style={textareaStyle}
          disabled={disabled}
          rows={rows}
      />
  );
});
OptimizedTextarea.displayName = "OptimizedTextarea";

const TypeBadgeWithFreshman = ({
                                 type,
                                 gradeNumber,
                                 lineupMemo,
                               }: {
  type: UserRetreatRegistrationType | null;
  gradeNumber: number;
  lineupMemo?: string;
}) => {
  if (lineupMemo) {
    const lowerMemo = lineupMemo.toLowerCase();
    if (lowerMemo.includes("sc")) {
      return (
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200">
            <User className="h-3.5 w-3.5 text-purple-500 mr-1.5" />
            <span className="text-xs font-medium text-purple-700">SC</span>
          </div>
      );
    }
    if (lowerMemo.includes("h")) {
      return (
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
            <User className="h-3.5 w-3.5 text-green-500 mr-1.5" />
            <span className="text-xs font-medium text-green-700">H</span>
          </div>
      );
    }
  }
  if (type) {
    switch (type) {
      case UserRetreatRegistrationType.NEW_COMER:
        return (
            <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-pink-50 border border-pink-200">
              <UserPlus className="h-3.5 w-3.5 text-pink-500 mr-1.5" />
              <span className="text-xs font-medium text-pink-700">새가족</span>
            </div>
        );
      case UserRetreatRegistrationType.SOLDIER:
        return (
            <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200">
              <Shield className="h-3.5 w-3.5 text-indigo-500 mr-1.5" />
              <span className="text-xs font-medium text-indigo-700">군지체</span>
            </div>
        );
      case UserRetreatRegistrationType.STAFF:
        return (
            <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200">
              <User className="h-3.5 w-3.5 text-gray-500 mr-1.5" />
              <span className="text-xs font-medium text-gray-700">간사</span>
            </div>
        );
      default:
        return <span>{type}</span>;
    }
  }
  if (gradeNumber === 1) {
    return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200">
          <GraduationCap className="h-3.5 w-3.5 text-orange-500 mr-1.5" />
          <span className="text-xs font-medium text-orange-700">새돌</span>
        </div>
    );
  }
  return <span>-</span>;
};

export const GBSLineupTable = React.memo(function GBSLineupTable({
                                                                   registrations = [],
                                                                   schedules = [],
                                                                   retreatSlug,
                                                                 }: {
  registrations: IUserRetreatGBSLineup[];
  schedules: any[];
  retreatSlug: string;
}) {
  const addToast = useToastStore((state) => state.add);
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [editingMemo, setEditingMemo] = useState<Record<string, boolean>>({});
  const [memoValues, setMemoValues] = useState<Record<string, string>>({});
  const [gbsNumberInputs, setGbsNumberInputs] = useState<Record<string, string>>({});
  const [memoBgColors, setMemoBgColors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyUnassigned, setShowOnlyUnassigned] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [selectedSchedules, setSelectedSchedules] = useState<string[]>([]);
  const [isScheduleFilterModalOpen, setIsScheduleFilterModalOpen] = useState(false);

  const [editingScheduleMemo, setEditingScheduleMemo] = useState<Record<string, boolean>>({});
  const [scheduleMemoValues, setScheduleMemoValues] = useState<Record<string, string>>({});

  const confirmDialog = useConfirmDialogStore();

  const lineupEndpoint = `/api/v1/retreat/${retreatSlug}/line-up/user-lineups`;

  const handleMemoValueChange = useCallback((id: string, value: string) => {
    setMemoValues((prev) => ({
      ...prev,
      [id]: value,
    }));
  }, []);

  const transformedData = useMemo(() => {
    if (!registrations.length || !schedules.length) return [];
    return registrations.map((registration) => {
      const scheduleData: Record<string, boolean> = {};
      schedules.forEach((schedule) => {
        scheduleData[`schedule_${schedule.id}`] =
            registration.userRetreatRegistrationScheduleIds?.includes(
                schedule.id
            ) || false;
      });
      return {
        id: registration.id,
        userId: registration.userId,
        maleCount: registration.maleCount,
        femaleCount: registration.femaleCount,
        fullAttendanceCount: registration.fullAttendanceCount,
        partialAttendanceCount: registration.partialAttendanceCount,
        department: `${registration.univGroupNumber}부`,
        gender: registration.gender,
        grade: `${registration.gradeNumber}학년`,
        name: registration.name,
        phoneNumber: registration.phoneNumber,
        schedule: scheduleData,
        type: registration.userType,
        isLeader: registration.isLeader,
        isFullAttendance: registration.isFullAttendance,
        currentLeader: registration.currentLeader,
        gbsNumber: registration.gbsNumber,
        gbsMemo: registration.gbsMemo,
        lineupMemo: registration.lineupMemo,
        lineupMemoId: registration.lineupMemoId,
        lineupMemocolor: registration.lineupMemocolor,
        unresolvedLineupHistoryMemo: registration.unresolvedLineupHistoryMemo,
        adminMemo: registration.adminMemo,
      };
    });
  }, [registrations, schedules]);

  useEffect(() => {
    if (transformedData.length > 0) {
      setData(transformedData);
      setFilteredData(transformedData);
    }
  }, [transformedData]);

  const departmentOptions = useMemo(() => {
    const departments = Array.from(new Set(data.map((row) => row.department).filter(Boolean)));
    return departments.sort((a, b) => {
      const aNum = parseInt(a.replace("부", ""));
      const bNum = parseInt(b.replace("부", ""));
      return aNum - bNum;
    });
  }, [data]);

  const filteredDataMemo = useMemo(() => {
    let temp = data;
    if (showOnlyUnassigned) {
      temp = temp.filter(
          (row) => !row.gbsNumber || row.gbsNumber === "" || row.gbsNumber === null
      );
    }
    if (selectedDepartments.length > 0) {
      temp = temp.filter((row) => selectedDepartments.includes(row.department));
    }
    if (selectedSchedules.length > 0) {
      temp = temp.filter((row) => {
        return selectedSchedules.every((scheduleKey) => row.schedule[scheduleKey] === true);
      });
    }
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      temp = temp.filter(
          (row) =>
              String(row.gbsNumber ?? "").includes(lower) ||
              (row.name?.toLowerCase().includes(lower) ?? false) ||
              (row.lineupMemo?.toLowerCase().includes(lower) ?? false) ||
              (row.department?.toLowerCase().includes(lower) ?? false) ||
              (row.grade?.toLowerCase().includes(lower) ?? false) ||
              (row.type?.toLowerCase().includes(lower) ?? false)
      );
    }
    return temp;
  }, [data, showOnlyUnassigned, searchTerm, selectedDepartments, selectedSchedules]);

  useEffect(() => {
    setFilteredData(filteredDataMemo);
  }, [filteredDataMemo]);

  const groupedData = useMemo(() => {
    function groupByGbsNumber(rows: any[]) {
      const group: Record<string, any[]> = {};
      rows.forEach((row) => {
        const key = row.gbsNumber?.toString() || "null";
        if (!group[key]) {
          group[key] = [];
        }
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
    }
    return groupByGbsNumber(filteredData);
  }, [filteredData]);

  const setLoading = (id: string, action: string, isLoading: boolean) => {
    setLoadingStates((prev) => ({
      ...prev,
      [`${id}_${action}`]: isLoading,
    }));
  };
  const isLoading = (id: string, action: string) => {
    return loadingStates[`${id}_${action}`];
  };

  const handleStartEditMemo = useCallback(
      (id: string, currentMemo: string, currentColor?: string) => {
        setEditingMemo((prev) => ({ ...prev, [id]: true }));
        setMemoValues((prev) => ({ ...prev, [id]: currentMemo || "" }));
        setMemoBgColors((prev) => ({
          ...prev,
          [id]: currentColor || "",
        }));
      },
      []
  );

  const handleCancelEditMemo = useCallback((id: string) => {
    setEditingMemo((prev) => ({ ...prev, [id]: false }));
    setMemoValues((prev) => ({ ...prev, [id]: "" }));
  }, []);

  const handleSaveMemo = async (id: string) => {
    const memo = memoValues[id];
    const color = memoBgColors[id];
    const currentRow = filteredData.find((row) => row.id === id);
    const memoId = currentRow?.lineupMemoId;
    setLoading(id, "memo", true);
    try {
      if ((memo && memo.trim()) || color !== undefined) {
        const processedColor = color === "" ? null : color ? color.trim() : undefined;
        if (memoId) {
          await webAxios.put(
              `/api/v1/retreat/${retreatSlug}/line-up/${memoId}/lineup-memo`,
              {
                memo: memo.trim(),
                color: processedColor,
              }
          );
        } else {
          await webAxios.post(
              `/api/v1/retreat/${retreatSlug}/line-up/${id}/lineup-memo`,
              {
                memo: memo.trim(),
                color: processedColor,
              }
          );
        }
      }
      setFilteredData((prev) =>
          prev.map((row) =>
              row.id === id
                  ? {
                    ...row,
                    lineupMemo: memo,
                    lineupMemoId: memoId ?? row.lineupMemoId,
                    memoError: false,
                  }
                  : row
          )
      );
      setData((prev) =>
          prev.map((row) =>
              row.id === id
                  ? {
                    ...row,
                    lineupMemo: memo,
                    lineupMemoId: memoId ?? row.lineupMemoId,
                    memoError: false,
                  }
                  : row
          )
      );
      setEditingMemo((prev) => ({ ...prev, [id]: false }));
      setMemoValues((prev) => ({ ...prev, [id]: "" }));
      addToast({
        title: "성공",
        description: memoId
            ? "메모가 성공적으로 수정되었습니다."
            : "메모가 성공적으로 저장되었습니다.",
        variant: "success",
      });
    } catch (error) {
      setFilteredData((prev) =>
          prev.map((row) => (row.id === id ? { ...row, memoError: true } : row))
      );
      setData((prev) =>
          prev.map((row) => (row.id === id ? { ...row, memoError: true } : row))
      );
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
    } finally {
      setLoading(id, "memo", false);
    }
  };

  const handleDeleteMemo = async (id: string) => {
    const currentRow = filteredData.find((row) => row.id === id);
    const memoId = currentRow?.lineupMemoId;
    setLoading(id, "delete_memo", true);
    try {
      await webAxios.delete(
          `/api/v1/retreat/${retreatSlug}/line-up/${memoId}/lineup-memo`
      );
      setFilteredData((prev) =>
          prev.map((row) =>
              row.id === id
                  ? {
                    ...row,
                    lineupMemo: "",
                    lineupMemoId: undefined,
                    memoError: false,
                  }
                  : row
          )
      );
      setData((prev) =>
          prev.map((row) =>
              row.id === id
                  ? {
                    ...row,
                    lineupMemo: "",
                    lineupMemoId: undefined,
                    memoError: false,
                  }
                  : row
          )
      );
      addToast({
        title: "성공",
        description: "메모가 성공적으로 삭제되었습니다.",
        variant: "success",
      });
    } catch (error) {
      setFilteredData((prev) =>
          prev.map((row) => (row.id === id ? { ...row, memoError: true } : row))
      );
      setData((prev) =>
          prev.map((row) => (row.id === id ? { ...row, memoError: true } : row))
      );
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
    } finally {
      setLoading(id, "delete_memo", false);
    }
  };

  const handleConfirmDeleteMemo = (id: string) => {
    confirmDialog.show({
      title: "메모 삭제",
      description: "정말로 메모를 삭제하시겠습니까?",
      onConfirm: () => handleDeleteMemo(id),
    });
  };

  const OptimizedEditMemoCell = React.memo(function OptimizedEditMemoCell({
                                                                            row,
                                                                            memoValue,
                                                                            isLoading,
                                                                            onSave,
                                                                            onCancel,
                                                                            color,
                                                                            setColor,
                                                                          }: {
    row: any;
    memoValue: string;
    isLoading: boolean;
    onSave: (val: string) => void;
    onCancel: () => void;
    color: string;
    setColor: (c: string) => void;
  }) {
    // ★ 이 localMemo만 이 컴포넌트(행)에서 관리!
    const [localMemo, setLocalMemo] = useState(memoValue);

    // props 바뀔 때만 동기화
    useEffect(() => {
      setLocalMemo(memoValue ?? "");
    }, [memoValue]);

    return (
        <div className="flex flex-col gap-2 p-1">
          <Textarea
              value={localMemo}
              onChange={e => setLocalMemo(e.target.value)}
              placeholder="메모를 입력하세요..."
              className="text-sm resize-none overflow-hidden w-full"
              disabled={isLoading}
              style={{
                height: Math.max(
                    60,
                    Math.min(200, localMemo.split("\n").length * 20 + 20)
                ) + "px",
              }}
              rows={Math.max(
                  3,
                  Math.min(10, localMemo.split("\n").length + 1)
              )}
          />
          <div className="flex flex-wrap gap-1">
            {MEMO_COLORS.map(c => {
              const isSelected =
                  (c === "transparent" && (color === "" || color === undefined)) ||
                  (c !== "transparent" && color === c);
              return (
                  <button
                      key={c}
                      style={{
                        backgroundColor: c === "transparent" ? "white" : c,
                        border: isSelected ? "2px solid black" : "1px solid #ccc",
                      }}
                      className={`w-5 h-5 rounded-full ${c === "transparent" ? "relative" : ""}`}
                      onClick={() => setColor(c === "transparent" ? "" : c)}
                      type="button"
                  >
                    {c === "transparent" && (
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
            <Button
                size="sm"
                variant="outline"
                onClick={() => onSave(localMemo)}
                disabled={isLoading}
                className="h-7 px-2"
            >
              {isLoading ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                  <Save className="h-3 w-3" />
              )}
            </Button>
            <Button
                size="sm"
                variant="ghost"
                onClick={onCancel}
                disabled={isLoading}
                className="h-7 px-2"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
    );
  });

  const scheduleColumns = generateScheduleColumns(schedules);

  return (
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between bg-gray-50 border-b">
          <div className="whitespace-nowrap">
            <CardTitle>GBS 라인업 현황 조회</CardTitle>
            <CardDescription>대학부 전체 GBS 목록 조회 및 배정</CardDescription>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            {/* ... 기존 다운로드 버튼, 생략 ... */}
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
              <div className="min-w-max">
                <div className="max-h-[80vh] overflow-y-auto">
                  <Table className="w-full whitespace-nowrap relative">
                    {/* ... TableHeader 그대로 ... */}
                    <TableBody>
                      {Object.entries(groupedData).map(([gbsNum, groupRows]) => {
                        const withNumber = groupRows.filter((r) => r.gbsNumber != null);
                        const withoutNumber = groupRows.filter((r) => r.gbsNumber == null);
                        return [
                          ...withNumber.map((row, idx) => (
                              <TableRow key={row.id}>
                                {idx === 0 && (
                                    <>
                                      <TableCell rowSpan={withNumber.length} className={`align-middle font-bold text-center px-2 py-1 ${withNumber.length > COMPLETE_GROUP_ROW_COUNT ? "bg-rose-200" : ""}`}>{row.gbsNumber}</TableCell>
                                      <TableCell rowSpan={withNumber.length} className="align-middle text-center font-semibold px-2 py-1">전참 {row.fullAttendanceCount}<br />부분참 {row.partialAttendanceCount}</TableCell>
                                      <TableCell rowSpan={withNumber.length} className="align-middle text-center font-semibold px-2 py-1">남 {row.maleCount}<br />여 {row.femaleCount}</TableCell>
                                    </>
                                )}
                                <TableCell className={row.isLeader ? "text-center bg-cyan-200 px-2 py-1" : "text-center px-2 py-1"}>{row.department}</TableCell>
                                <TableCell className={row.isLeader ? "text-center bg-cyan-200 px-2 py-1" : "text-center px-2 py-1"}><GenderBadge gender={row.gender} /></TableCell>
                                <TableCell className={row.isLeader ? "text-center bg-cyan-200 px-2 py-1" : "text-center px-2 py-1"}>{row.grade}</TableCell>
                                <TableCell className={row.isLeader ? "text-center bg-cyan-200 font-bold text-base px-2 py-1" : "text-center px-2 py-1"}>{row.name}</TableCell>
                                <TableCell className={row.isLeader ? "text-center bg-cyan-200 px-2 py-1" : "text-center px-2 py-1"}>{row.currentLeader}</TableCell>
                                <TableCell className={row.isLeader ? "text-center bg-cyan-200 px-2 py-1" : "text-center px-2 py-1"}>{row.phoneNumber}</TableCell>
                                <TableCell className={row.isLeader ? "bg-cyan-200 text-center px-2 py-1" : "text-center px-2 py-1"} style={{ backgroundColor: row.lineupMemocolor }}>
                                {editingMemo[row.id] ? (
                                    <OptimizedEditMemoCell
                                        key={row.id}
                                        row={row}
                                        memoValue={memoValues[row.id] || ""}
                                        isLoading={isLoading(row.id, "memo")}
                                        onSave={val => {
                                            setMemoValues(prev => ({ ...prev, [row.id]: val }));
                                            handleSaveMemo(row.id);
                                        }}
                                        onCancel={() => handleCancelEditMemo(row.id)}
                                        color={memoBgColors[row.id] || ""}
                                        setColor={c =>
                                            setMemoBgColors(prev => ({ ...prev, [row.id]: c }))
                                        }
                                    />
                                    ) : (
                                      <div className="flex items-start gap-2 p-1">
                                        <div className="flex-1 text-sm text-gray-600 cursor-pointer hover:bg-gray-100 p-1 rounded min-h-[24px] whitespace-pre-wrap break-words"
                                             onClick={() => handleStartEditMemo(row.id, row.lineupMemo, row.lineupMemocolor)}>
                                          {row.lineupMemo || "메모를 추가하려면 클릭하세요"}
                                        </div>
                                        {row.lineupMemo && (
                                            <Button size="sm" variant="ghost" onClick={() => handleConfirmDeleteMemo(row.id)} disabled={isLoading(row.id, "delete_memo")} className="h-6 w-6 p-0 text-red-500 hover:text-red-700 flex-shrink-0 mt-1">
                                              {isLoading(row.id, "delete_memo") ? (<div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />) : (<Trash2 className="h-3 w-3" />)}
                                            </Button>
                                        )}
                                      </div>
                                  )}
                                </TableCell>
                                <TableCell className={`group-hover:bg-gray-50 text-center whitespace-nowrap px-2 py-1 ${row.isLeader ? "bg-cyan-200" : ""}`}>
                                  <TypeBadgeWithFreshman type={row.type} gradeNumber={parseInt(row.grade.split('학년')[0])} lineupMemo={row.lineupMemo} />
                                </TableCell>
                                {generateScheduleColumns(schedules).map((col) => (
                                    <TableCell key={`${row.id}-${col.key}`} className={`px-2 py-1 text-center group-hover:bg-gray-50 whitespace-nowrap ${row.isLeader ? "bg-cyan-200" : ""}`}>
                                      <Checkbox checked={row.schedule[col.key]} disabled className={row.schedule[col.key] ? col.bgColorClass : ""} />
                                    </TableCell>
                                ))}
                                <TableCell className={`align-middle text-center px-2 py-1 ${row.isLeader ? "bg-cyan-200" : ""}`}>
                                  {/* GBS 배정하기 input 등 생략(기존과 동일) */}
                                </TableCell>
                                {idx === 0 && (<TableCell rowSpan={withNumber.length} className="align-middle text-center px-2 py-1">{row.gbsMemo}</TableCell>)}
                                {/* 이하 기타 칸 그대로 ... */}
                              </TableRow>
                          )),
                          ...withoutNumber.map((row) => (
                              <TableRow key={row.id}>
                                <TableCell className="text-center px-2 py-1" />
                                <TableCell className="text-center px-2 py-1" />
                                <TableCell className="text-center px-2 py-1" />
                                <TableCell className="text-center px-2 py-1">{row.department}</TableCell>
                                <TableCell className="text-center px-2 py-1"><GenderBadge gender={row.gender} /></TableCell>
                                <TableCell className="text-center px-2 py-1">{row.grade}</TableCell>
                                <TableCell className={row.isLeader ? "font-bold text-blue-600 text-center px-2 py-1" : "text-center px-2 py-1"}>{row.name}</TableCell>
                                <TableCell className={row.isLeader ? "font-bold text-blue-600 text-center px-2 py-1" : "text-center px-2 py-1"}>{row.currentLeader}</TableCell>
                                <TableCell className="text-center px-2 py-1">{row.phoneNumber}</TableCell>
                                <TableCell className={row.isLeader ? "bg-cyan-200 text-center px-2 py-1" : "text-center px-2 py-1"} style={{ backgroundColor: row.lineupMemocolor }}>
                                  {editingMemo[row.id] ? (
                                        <OptimizedEditMemoCell
                                            key={row.id}
                                            row={row}
                                            memoValue={memoValues[row.id] || ""}
                                            isLoading={isLoading(row.id, "memo")}
                                            onSave={val => {
                                              setMemoValues(prev => ({ ...prev, [row.id]: val }));
                                              handleSaveMemo(row.id);
                                            }}
                                            onCancel={() => handleCancelEditMemo(row.id)}
                                            color={memoBgColors[row.id] || ""}
                                            setColor={c =>
                                                setMemoBgColors(prev => ({ ...prev, [row.id]: c }))
                                            }
                                        />
                                    ) : (
                                      <div className="flex items-start gap-2 p-1">
                                          <div className="flex-1 text-sm text-gray-600 cursor-pointer hover:bg-gray-100 p-1 rounded min-h-[24px] whitespace-pre-wrap break-words"
                                               onClick={() => handleStartEditMemo(row.id, row.lineupMemo, row.lineupMemocolor)}>
                                            {row.lineupMemo || "메모를 추가하려면 클릭하세요"}
                                          </div>
                                          {row.lineupMemo && (
                                              <Button size="sm" variant="ghost" onClick={() => handleConfirmDeleteMemo(row.id)} disabled={isLoading(row.id, "delete_memo")} className="h-6 w-6 p-0 text-red-500 hover:text-red-700 flex-shrink-0 mt-1">
                                                {isLoading(row.id, "delete_memo") ? (<div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />) : (<Trash2 className="h-3 w-3" />)}
                                              </Button>
                                          )}
                                      </div>
                                  )}
                                </TableCell>
                                <TableCell className={`group-hover:bg-gray-50 text-center whitespace-nowrap px-2 py-1 ${row.isLeader ? "bg-cyan-200" : ""}`}>
                                  <TypeBadgeWithFreshman type={row.type} gradeNumber={parseInt(row.grade.split('학년')[0])} lineupMemo={row.lineupMemo} />
                                </TableCell>
                                {generateScheduleColumns(schedules).map((col) => (
                                    <TableCell key={`${row.id}-${col.key}`} className="px-2 py-1 text-center group-hover:bg-gray-50 whitespace-nowrap">
                                      <Checkbox checked={row.schedule[col.key]} disabled className={row.schedule[col.key] ? col.bgColorClass : ""} />
                                    </TableCell>
                                ))}
                                <TableCell className="align-middle text-center px-2 py-1">{/* GBS 배정하기 input 등 생략(기존과 동일) */}</TableCell>
                                <TableCell className="text-center px-2 py-1" />
                              </TableRow>
                          )),
                        ];
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
  );
});
