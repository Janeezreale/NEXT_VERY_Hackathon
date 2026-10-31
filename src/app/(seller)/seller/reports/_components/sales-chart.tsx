"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Props = { rows: { date: string; revenue: number; completed: number }[] };

export default function SalesChart({ rows }: Props) {
  return <div aria-hidden="true"><ResponsiveContainer width="100%" height={240}><BarChart data={rows} margin={{ top: 12, right: 8, bottom: 0, left: 0 }} accessibilityLayer={false}><CartesianGrid vertical={false} stroke="#E2E8E3" /><XAxis dataKey="date" tick={{ fill: "#626B77", fontSize: 12 }} /><YAxis width={64} tick={{ fill: "#626B77", fontSize: 12 }} tickFormatter={(value: number) => new Intl.NumberFormat("ko-KR").format(value)} /><Tooltip formatter={(value) => [`${new Intl.NumberFormat("ko-KR").format(Number(value))}원`, "판매 매출 예시"]} /><Bar dataKey="revenue" name="판매 매출 예시 (원)" fill="#1F7A54" radius={[6, 6, 0, 0]} isAnimationActive={false} /></BarChart></ResponsiveContainer></div>;
}
