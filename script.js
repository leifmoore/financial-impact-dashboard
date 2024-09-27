// Function to update the projection years label
function updateProjectionYearsLabel(value) {
    document.getElementById('projectionYearsLabel').innerText = `${value} Years`;
}

// Global variables to store data
let netCashFlowData = [];
let years = [];

// Function to update outputs and perform calculations
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

    // Input validation
    if (
        isNaN(staffSalary) || isNaN(staffBefore) || isNaN(staffAfter) ||
        isNaN(developmentCostMonthly) || isNaN(developmentPeriod) ||
        isNaN(inflationRate) || isNaN(projectionYears) ||
        isNaN(efficiencySavings) || isNaN(bestCaseReduction) || isNaN(worstCaseReduction)
    ) {
        alert("Please enter valid input values.");
        return;
    }

    if (staffAfter > staffBefore) {
        alert("Target number of staff after attrition cannot be greater than the number before attrition.");
        return;
    }

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

    // Update Chart and Grid
    updateChart();
    updateDataGrid(); // Changed from updateDataTable() to updateDataGrid()

    // Show or Hide KPIs based on selection
    toggleKPIs();
}

// Function to show or hide KPIs based on user selection
function toggleKPIs() {
    document.getElementById('outputTotalDevCost').style.display = document.getElementById('kpiTotalDevCost').checked ? 'block' : 'none';
    document.getElementById('outputAnnualStaffSavings').style.display = document.getElementById('kpiAnnualStaffSavings').checked ? 'block' : 'none';
    document.getElementById('outputNetCashFlow').style.display = document.getElementById('kpiNetCashFlow').checked ? 'block' : 'none';
    document.getElementById('outputROI').style.display = document.getElementById('kpiROI').checked ? 'block' : 'none';
    document.getElementById('outputPaybackPeriod').style.display = document.getElementById('kpiPaybackPeriod').checked ? 'block' : 'none';
}

// Global variable for the chart instance
let financialChart;

// Function to update the chart
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

// Function to update the data grid with cumulative net cash flow stacked below each year
function updateDataGrid() {
    const dataGrid = document.getElementById('dataGrid');
    // Clear existing grid
    dataGrid.innerHTML = '';

    // Set the number of columns based on the number of years
    dataGrid.style.gridTemplateColumns = `repeat(${years.length}, 1fr)`;

    // Loop through each year and create a column
    for (let i = 0; i < years.length; i++) {
        // Create a container for each column
        const column = document.createElement('div');
        column.className = 'grid-column';

        // Create year cell
        const yearCell = document.createElement('div');
        yearCell.className = 'grid-item header';
        yearCell.innerText = `Year ${i + 1}`;
        column.appendChild(yearCell);

        // Create cash flow cell
        const cashFlowCell = document.createElement('div');
        cashFlowCell.className = 'grid-item data';
        cashFlowCell.innerText = `£${parseFloat(netCashFlowData[i]).toLocaleString()}`;
        column.appendChild(cashFlowCell);

        // Append the column to the data grid
        dataGrid.appendChild(column);
    }
}

// Initialize dashboard when the page loads
window.onload = function() {
    updateOutputs();
};

// Function to export data as CSV
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
