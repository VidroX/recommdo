import * as React from 'react';
import { InnerStatistic } from '../../pages/projects/[pid]';
import { useTranslation } from 'next-i18next';
import { ResponsivePie } from '@nivo/pie';
import { useEffect, useMemo, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import uniqolor from 'uniqolor';

interface StatisticsGraphProps {
	statistics?: InnerStatistic[] | null;
	onGraphItemClick?: (item: NivoPieDataOption) => void;
	onItemsGenerated?: (items: NivoPieDataOption[]) => void;
}

export interface NivoPieDataOption {
	id: string;
	label: string;
	value: number;
	stars: number;
	color?: string;
}

const StatisticsGraph = ({
	statistics = null,
	onGraphItemClick = (item) => {},
	onItemsGenerated = (items) => {},
}: StatisticsGraphProps) => {
	const { t: commonTranslate } = useTranslation('common');
	const { t } = useTranslation('projects');

	const data = useMemo(() => {
		if (statistics == null || statistics.length <= 0) {
			return [];
		}

		const ratings: NivoPieDataOption[] = [];
		for (let i = 0; i < statistics.length; i++) {
			ratings.push({
				id: t(statistics[i].stars + 'StarsUsers'),
				label: t(statistics[i].stars + 'Stars'),
				value: statistics[i].count,
				stars: statistics[i].stars,
				color: uniqolor.random({ format: 'hsl', saturation: 80, lightness: [70, 80] }).color,
			});
		}

		return ratings;
	}, [statistics]);

	useEffect(() => {
		if (data != null && data?.length > 0) {
			if (onItemsGenerated) {
				onItemsGenerated(data);
			}
		}
	}, [data]);

	if (statistics == null || statistics.length <= 0) {
		return <p>{commonTranslate('requiredDataNotFound')}</p>;
	}

	return (
		<AutoSizer disableHeight>
			{({ width }) => (
				<div style={{ width, height: 500 }}>
					<ResponsivePie
						animate
						data={data}
						colors={{ datum: 'data.color' }}
						margin={{ top: 40, right: 100, bottom: 40, left: 100 }}
						padAngle={0.7}
						cornerRadius={3}
						activeOuterRadiusOffset={8}
						borderWidth={1}
						borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
						arcLinkLabelsSkipAngle={10}
						arcLinkLabelsTextColor="#333333"
						arcLinkLabelsThickness={2}
						arcLinkLabelsColor={{ from: 'color' }}
						arcLabelsSkipAngle={10}
						arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
						onClick={(node, event) => {
							if (onGraphItemClick) {
								onGraphItemClick(node.data);
							}
						}}
					/>
				</div>
			)}
		</AutoSizer>
	);
};

export default StatisticsGraph;
