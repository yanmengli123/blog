/* ============================================
   鱼行尺素 - 图表（贡献热力图 + 折线图）
   ============================================ */

/* ---- GitHub 风格贡献热力图 ---- */
function initContributionHeatmap(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container || !data || data.length === 0) return;

  // Group by weeks (Sunday start)
  const weeks = [];
  let currentWeek = [];
  data.forEach((day, i) => {
    const d = new Date(day.date);
    if (d.getDay() === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  });
  if (currentWeek.length > 0) weeks.push(currentWeek);

  // Color scale
  const colors = {
    none:    '#ebedf0',
    low:     '#9be9a8',
    mid:     '#40c463',
    high:    '#30a14e',
    peak:    '#216e39',
  };
  const darkColors = {
    none:    '#161b22',
    low:     '#0e4429',
    mid:     '#006d32',
    high:    '#26a641',
    peak:    '#39d353',
  };

  function getColor(count, isDark) {
    if (count === 0) return isDark ? darkColors.none : colors.none;
    if (count <= 2)  return isDark ? darkColors.low  : colors.low;
    if (count <= 4)  return isDark ? darkColors.mid  : colors.mid;
    if (count <= 6)  return isDark ? darkColors.high : colors.high;
    return             isDark ? darkColors.peak : colors.peak;
  }

  const isDark = document.documentElement.classList.contains('dark');

  let html = '<div class="flex gap-[3px] overflow-x-auto pb-2">';

  // Month labels
  html += '<div class="flex flex-col gap-[3px] mr-2 shrink-0" style="padding-top:20px">';
  weeks.forEach((week, wi) => {
    const firstDay = week[0];
    const month = new Date(firstDay.date).toLocaleString('zh-CN', { month: 'short' });
    const showMonth = wi === 0 || new Date(week[0].date).getDate() <= 7;
    html += `<div style="height:13px; font-size:10px; color:var(--color-muted,#94a3b8);" class="flex items-center">${showMonth ? month : ''}</div>`;
  });
  html += '</div>';

  weeks.forEach(week => {
    html += '<div class="flex flex-col gap-[3px] shrink-0">';
    week.forEach(day => {
      const color = getColor(day.count, isDark);
      const title = `${day.date}: ${day.count} 次提交`;
      html += `<div class="heat-cell" style="background:${color}" title="${title}"></div>`;
    });
    // pad empty cells to align Sunday
    const pad = 7 - week.length;
    for (let i = 0; i < pad; i++) {
      html += `<div style="width:12px;height:12px"></div>`;
    }
    html += '</div>';
  });

  html += '</div>';
  html += `
    <div class="flex justify-between items-center mt-3 text-xs" style="color:var(--color-muted,#94a3b8)">
      <span>Less</span>
      <div class="flex gap-1">
        ${[colors.none, colors.low, colors.mid, colors.high, colors.peak]
          .map(c => `<div style="width:12px;height:12px;border-radius:2px;background:${c}"></div>`).join('')}
      </div>
      <span>More</span>
    </div>`;

  container.innerHTML = html;
}

/* ---- 贡献折线图（使用 ECharts）---- */
function initContributionChart(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const chart = echarts.init(container);
  const isDark = document.documentElement.classList.contains('dark');

  // Aggregate weekly
  const weekly = [];
  for (let i = 0; i < data.length; i += 7) {
    const slice = data.slice(i, i + 7);
    const total = slice.reduce((s, d) => s + d.count, 0);
    weekly.push(total);
  }

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#1e293b' : '#fff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      textStyle: { color: isDark ? '#f1f5f9' : '#1e293b' },
      formatter: (p) => `第 ${p[0].axisIndex + 1} 周: <b>${p[0].value}</b> 次提交`,
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: weekly.map((_, i) => `第${i + 1}周`),
      axisLine: { lineStyle: { color: isDark ? '#334155' : '#e2e8f0' } },
      axisLabel: {
        color: isDark ? '#94a3b8' : '#64748b',
        interval: Math.floor(weekly.length / 8),
        fontSize: 11,
      },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 11 },
      splitLine: { lineStyle: { color: isDark ? '#1e293b' : '#f1f5f9' } },
    },
    series: [{
      data: weekly,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        color: '#8b5cf6',
        width: 3,
        shadowColor: 'rgba(139,92,246,0.4)',
        shadowBlur: 8,
      },
      itemStyle: {
        color: '#8b5cf6',
        borderWidth: 2,
        borderColor: '#fff',
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(139,92,246,0.25)' },
            { offset: 1, color: 'rgba(139,92,246,0)' },
          ],
        },
      },
    }],
    animation: true,
    animationDuration: 1200,
    animationEasing: 'cubicOut',
  };

  chart.setOption(option);

  // Responsive
  window.addEventListener('resize', () => chart.resize());

  // Re-apply on dark mode toggle
  const observer = new MutationObserver(() => {
    const nowDark = document.documentElement.classList.contains('dark');
    chart.setOption({
      tooltip: {
        backgroundColor: nowDark ? '#1e293b' : '#fff',
        borderColor: nowDark ? '#334155' : '#e2e8f0',
        textStyle: { color: nowDark ? '#f1f5f9' : '#1e293b' },
      },
      xAxis: {
        axisLine: { lineStyle: { color: nowDark ? '#334155' : '#e2e8f0' } },
        axisLabel: { color: nowDark ? '#94a3b8' : '#64748b' },
      },
      yAxis: {
        axisLabel: { color: nowDark ? '#94a3b8' : '#64748b' },
        splitLine: { lineStyle: { color: nowDark ? '#1e293b' : '#f1f5f9' } },
      },
    });
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}
