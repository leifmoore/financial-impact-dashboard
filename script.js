function updateProjectionYearsLabel(value) {
    document.getElementById('projectionYearsLabel').innerText = `${value} Years`;
}

let netCashFlowData = [];
let years = [];

function updateOutputs() {
    // Get input values
    const staffSalary = parseFloat(document.getElementById('staffSalary').value);
    const staffBefore = parseInt(document.getElementById('staffBeforeAttrition').value);
    const staffAfter = parseInt(document.getElementById('staffAfterAttrition').value);
    const developmentCostMonthly = parseFloat(document.getElementById('developmentCost').value);
    const developmentPeriod = parseInt(document.getElementById('developmentPeriod').value);
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) / 100;
    const projectionYears = parseInt(document.getElementById('projectionYears').value);
    const efficiencySavings = parseFloat(document.getElementById('efficiencySavings').value);
    const bestCaseReduction = parseFloat(document.getElementById('bestCaseReduction').value) / 100;
    const worstCaseReduction = parseFloat(document.getElementById('worstCaseReduction').value) / 100;

    // Calculate Total Development Cost
    const totalDevCost = developmentCostMonthly * developmentPeriod;
    document.getElementById('totalDevCostValue').innerText = `£${totalDevCost.toLocaleString()}`;

    // Calculate Annual Staff Savings
    const staffReduction = staffBefore - staffAfter;
    const annualStaffSavings = staffReduction * staffSalary;
    document.getElementById('annualStaffSavingsValue').innerText = `£${annualStaffSavings.toLocaleString()}`;

    // Calculate Net Cash Flow Over Time
    netCashFlowData = [];
    years = [];
    let cumulativeCashFlow = -totalDevCost;
    let annualSalary = staffSalary;
    let paybackAchieved = false;
    let paybackPeriod = 0;

    for (let year = 1; year <= projectionYears; year++) {
        // Adjust salary for inflation
        if (year > 1) {
            annualSalary *= (1 + inflationRate);
        }

        // Recalculate annual staff savings with adjusted salary
        const adjustedAnnualStaffSavings = staffReduction * annualSalary;

        // Net Cash Flow for the year
        const netCashFlow = adjustedAnnualStaffSavings + efficiencySavings;
        cumulativeCashFlow += netCashFlow;
        netCashFlowData.push(cumulativeCashFlow.toFixed(2));
        years.push(`Year ${year}`);

        // Determine Payback Period
        if (!paybackAchieved && cumulativeCashFlow >= 0) {
            paybackPeriod = year - (cumulativeCashFlow - netCashFlow) / netCashFlow;
            paybackAchieved = true;
        }
    }

    // Update ROI
    const totalNetGain = cumulativeCashFlow;
    const roi = ((totalNetGain + totalDevCost) / totalDevCost) * 100;
    document.getElementById('roiValue').innerText = `${roi.toFixed(1)}%`;

    // Update Payback Period
    if (paybackAchieved) {
        document.getElementById('paybackPeriodValue').innerText = `${paybackPeriod.toFixed(2)} Years`;
    } else {
        document.getElementById('paybackPeriodValue').innerText = `> ${projectionYears} Years`;
    }

    // Update Chart and Table
    updateChart();
    updateDataTable();

    // Show or Hide KPIs based on selection
    toggleKPIs();
}

function toggleKPIs() {
    document.getElementById('outputTotalDevCost').style.display = document.getElementById('kpiTotalDevCost').checked ? 'block' : 'none';
    document.getElementById('outputAnnualStaffSavings').style.display = document.getElementById('kpiAnnualStaffSavings').checked ? 'block' : 'none';
    document.getElementById('outputNetCashFlow').style.display = document.getElementById('kpiNetCashFlow').checked ? 'block' : 'none';
    document.getElementById('outputROI').style.display = document.getElementById('kpiROI').checked ? 'block' : 'none';
    document.getElementById('outputPaybackPeriod').style.display = document.getElementById('kpiPaybackPeriod').checked ? 'block' : 'none';
}

let financialChart; // Global variable for the chart instance

function updateChart() {
    const chartType = document.getElementById('chartType').value;

    // Destroy previous chart instance if it exists
    if (financialChart) {
        financialChart.destroy();
    }

    const ctx = document.getElementById('financialChart').getContext('2d');
    financialChart = new Chart(ctx, {
        type: chartType === 'area' ? 'line' : chartType,
        data: {
            labels: years,
            datasets: [{
                label: 'Cumulative Net Cash Flow',
                data: netCashFlowData,
                backgroundColor: chartType === 'area' ? 'rgba(20, 40, 75, 0.2)' : 'rgba(240, 173, 78, 0.2)',
                borderColor: 'rgba(20, 40, 75, 1)',
                borderWidth: 2,
                fill: chartType === 'area',
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '£' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += '£' + parseFloat(context.parsed.y).toLocaleString();
                            return label;
                        }
                    }
                }
            }
        }
    });
}

function updateDataTable() {
    const table = document.getElementById('dataTable');
    // Clear existing table
    table.innerHTML = '';

    // Create table headers
    const headerRow = table.insertRow();
    headerRow.insertCell().outerHTML = '<th>Year</th>';
    headerRow.insertCell().outerHTML = '<th>Cumulative Net Cash Flow (£)</th>';

    // Populate table data
    for (let i = 0; i < years.length; i++) {
        const row = table.insertRow();
        row.insertCell().innerText = years[i];
        row.insertCell().innerText = `£${parseFloat(netCashFlowData[i]).toLocaleString()}`;
    }
}

// Initialize dashboard when the page loads
window.onload = function() {
    updateOutputs();
};

function exportToCSV() {
    let csvContent = "Year,Cumulative Net Cash Flow (£)\n";

    for (let i = 0; i < years.length; i++) {
        csvContent += `${years[i]},${parseFloat(netCashFlowData[i]).toFixed(2)}\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "financial_data.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
