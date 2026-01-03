
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { FormulateDietOutput } from '../types';

interface IngredientPieChartProps {
    data: FormulateDietOutput['dietComposition'];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19AF', '#19AFFF', '#AFFF19'];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-2 border border-gray-300 rounded shadow-lg">
                <p className="font-semibold">{`${payload[0].name}: ${payload[0].value.toFixed(2)}%`}</p>
            </div>
        );
    }
    return null;
};

export const IngredientPieChart: React.FC<IngredientPieChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return <p>No data available for chart.</p>;
    }
    
    return (
        <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="percentage"
                        nameKey="ingredient"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};
