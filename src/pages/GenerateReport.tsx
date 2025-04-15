import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Layout from "@/components/Layout";
import Stepper from "@/components/Stepper";
import { useReport } from "@/context/ReportContext";
import { jsPDF } from "jspdf";
import autoTable from '@jspdf/autotable'; // Import autoTable
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  BarElement,
  ArcElement
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const getSteps = (reportType) => {
  if (reportType === "utilization") {
    return ["Cloud Provider", "Report Type", "Credentials", "Instances", "Generate"];
  } else {
    return ["Cloud Provider", "Report Type", "Credentials", "Date Selection", "Generate"];
  }
};

const GenerateReport = () => {
  const navigate = useNavigate();
  const { reportConfig, resetReport } = useReport();
  const [isGenerating, setIsGenerating] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = getSteps(reportConfig?.reportType || "utilization");

  useEffect(() => {
    if (!reportConfig) {
      navigate("/");
      return;
    }

    // Simulate report generation
    const timer = setTimeout(() => {
      setIsGenerating(false);
      setIsComplete(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [reportConfig, navigate]);

  const handleStartOver = () => {
    resetReport();
    navigate("/");
  };

  const generatePDF = () => {
    if (!reportConfig) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = margin;

    // Add logo and title
    doc.setFontSize(24);
    doc.setTextColor(0, 120, 212);
    doc.text("Nubinix Cloud Insights", pageWidth / 2, yPos, { align: "center" });
    yPos += 20;

    // Report type
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`${reportConfig.frequency.charAt(0).toUpperCase() + reportConfig.frequency.slice(1)} Utilization Report - ${reportConfig.provider.toUpperCase()}`, pageWidth / 2, yPos, { align: "center" });
    yPos += 20;

    // Generated date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPos);
    yPos += 20;

    // Selected Instances section
    doc.setFontSize(14);
    doc.text("Selected Instances", margin, yPos);
    yPos += 10;

    // Instance table headers
    const instanceHeaders = [["Instance ID", "Name", "Type", "Region"]];
    const instanceData = reportConfig.instances.map(instance => [
        instance.id,
        instance.name,
        instance.type,
        instance.region
    ]);

    doc.autoTable({
        head: instanceHeaders,
        body: instanceData,
        startY: yPos,
        margin: { left: margin },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
        theme: 'grid'
    });

    yPos = (doc as any).lastAutoTable.finalY + 20;

    // Selected Database Instances section
    if (reportConfig.rdsInstances && reportConfig.rdsInstances.length > 0) {
        doc.setFontSize(14);
        doc.text("Selected Database Instances", margin, yPos);
        yPos += 10;

        // Database table headers
        const dbHeaders = [["Instance ID", "Name", "Engine", "Region"]];
        const dbData = reportConfig.rdsInstances.map(instance => [
            instance.id,
            instance.name,
            instance.engine,
            instance.region
        ]);

        doc.autoTable({
            head: dbHeaders,
            body: dbData,
            startY: yPos,
            margin: { left: margin },
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
            theme: 'grid'
        });
    }


    // Add billing details if it's a billing report
    if (reportConfig.reportType === "billing" && reportConfig.billingPeriod) {
      doc.setFontSize(14);
      doc.setTextColor(70, 70, 70);
      doc.text("Billing Period Details", margin, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.text(`Year: ${reportConfig.billingPeriod.year}`, margin, yPos);
      yPos += 7;
      doc.text(`Month: ${reportConfig.billingPeriod.month}`, margin, yPos);
      yPos += 15;

      // Add sample billing data
      doc.setFontSize(14);
      doc.text("Billing Summary", margin, yPos);
      yPos += 10;

      const billingItems = [
        { service: "EC2 Instances", cost: "$456.78" },
        { service: "S3 Storage", cost: "$123.45" },
        { service: "RDS Databases", cost: "$234.56" },
        { service: "Lambda Functions", cost: "$56.78" },
        { service: "CloudFront", cost: "$76.54" },
      ];

      // Add billing table headers
      doc.setFontSize(10);
      doc.text("Service", margin, yPos);
      doc.text("Cost", margin + 130, yPos);
      yPos += 5;

      // Add line under headers
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;

      // Add billing rows
      doc.setFontSize(9);
      billingItems.forEach(item => {
        doc.text(item.service, margin, yPos);
        doc.text(item.cost, margin + 130, yPos);
        yPos += 7;
      });

      yPos += 5;
      doc.setDrawColor(100, 100, 100);
      doc.line(margin + 130, yPos, pageWidth - margin, yPos);
      yPos += 7;

      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text("Total", margin, yPos);
      doc.text("$948.11", margin + 130, yPos);
      doc.setFont(undefined, 'normal');
    }

    // Add a new page for performance metrics for utilization reports
    if (reportConfig.reportType === "utilization") {
      doc.addPage();
      yPos = margin;

      // Add metrics section title
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("Performance Metrics", pageWidth / 2, yPos, { align: "center" });
      yPos += 20;

      // In a real app we would dynamically generate charts based on actual data
      // For simplicity, we'll just add a placeholder text
      doc.setFontSize(12);
      doc.text("This report contains sample data for demonstration purposes.", margin, yPos);
      yPos += 10;
      doc.text("In a production environment, this report would include:", margin, yPos);
      yPos += 10;

      const bulletPoints = [
        "CPU Utilization trends",
        "Memory Usage patterns",
        "Disk I/O performance",
        "Network traffic analysis",
        "Cost optimization recommendations",
        "Security findings and recommendations"
      ];

      bulletPoints.forEach(point => {
        doc.text(`• ${point}`, margin + 10, yPos);
        yPos += 8;
      });
    }

    // Save the PDF with appropriate name based on report type
    const reportTypeName = reportConfig.reportType === "billing" ? "billing" : "utilization";
    doc.save(`nubinix-cloud-insights-${reportConfig.provider}-${reportTypeName}-${reportConfig.frequency}.pdf`);
  };

  // Determine the appropriate report type description based on the configuration
  const getReportTypeDescription = () => {
    if (!reportConfig) return "";

    if (reportConfig.reportType === "billing") {
      return `Your ${reportConfig.frequency} billing report for ${reportConfig.provider.toUpperCase()}`;
    } else {
      return `Your ${reportConfig.frequency} utilization report for ${reportConfig.provider.toUpperCase()}`;
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <Stepper steps={steps} currentStep={4} />

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-2xl">Generate Report</CardTitle>
            <CardDescription>
              {isGenerating 
                ? "Gathering metrics and generating your report..." 
                : isComplete 
                  ? "Your report has been generated successfully" 
                  : "Error generating report"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="py-8 flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">
                  This may take a few moments. We're collecting data from {reportConfig?.provider.toUpperCase()}.
                </p>
              </div>
            ) : isComplete ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center py-4">
                  <div className="bg-green-100 text-green-800 p-2 rounded-full">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium">Report Generated Successfully</h3>
                  <p className="mt-1 text-gray-500 text-center">
                    {getReportTypeDescription()} is ready to download.
                  </p>
                </div>

                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1 md:flex md:justify-between">
                      <p className="text-sm text-blue-800">
                        {reportConfig?.reportType === "billing" 
                          ? `The report includes billing data for ${reportConfig?.billingPeriod?.month} ${reportConfig?.billingPeriod?.year}.` 
                          : `The report includes data for ${reportConfig?.instances.length} instances and ${reportConfig?.rdsInstances.length} databases.`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sample charts that would be included in the report */}
                {reportConfig?.reportType === "utilization" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg bg-white shadow-sm">
                      <h4 className="text-sm font-medium mb-2">CPU Utilization</h4>
                      <Line 
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              display: false,
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              max: 100,
                            }
                          }
                        }} 
                        data={{
                          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                          datasets: [
                            {
                              label: 'CPU %',
                              data: [65, 59, 80, 81, 56, 55, 40],
                              borderColor: 'rgb(59, 130, 246)',
                              backgroundColor: 'rgba(59, 130, 246, 0.5)',
                            }
                          ],
                        }}
                      />
                    </div>

                    <div className="p-4 border rounded-lg bg-white shadow-sm">
                      <h4 className="text-sm font-medium mb-2">Memory Usage</h4>
                      <Bar
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              display: false,
                            },
                          },
                        }}
                        data={{
                          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                          datasets: [
                            {
                              label: 'Memory GB',
                              data: [12, 19, 15, 17, 14, 13, 11],
                              backgroundColor: 'rgba(99, 102, 241, 0.5)',
                            }
                          ],
                        }}
                      />
                    </div>
                  </div>
                )}

                {reportConfig?.reportType === "billing" && (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 border rounded-lg bg-white shadow-sm">
                      <h4 className="text-sm font-medium mb-2">Monthly Cost Breakdown</h4>
                      <Pie
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              position: 'right',
                            },
                          },
                        }}
                        data={{
                          labels: ['EC2', 'S3', 'RDS', 'Lambda', 'Other'],
                          datasets: [
                            {
                              data: [456.78, 123.45, 234.56, 56.78, 76.54],
                              backgroundColor: [
                                'rgba(54, 162, 235, 0.5)',
                                'rgba(255, 99, 132, 0.5)',
                                'rgba(75, 192, 192, 0.5)',
                                'rgba(255, 206, 86, 0.5)',
                                'rgba(153, 102, 255, 0.5)',
                              ],
                              borderColor: [
                                'rgba(54, 162, 235, 1)',
                                'rgba(255, 99, 132, 1)',
                                'rgba(75, 192, 192, 1)',
                                'rgba(255, 206, 86, 1)',
                                'rgba(153, 102, 255, 1)',
                              ],
                              borderWidth: 1,
                            },
                          ],
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertDescription>{error || "An unexpected error occurred while generating the report."}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleStartOver} disabled={isGenerating}>
              Start Over
            </Button>
            {isComplete && (
              <Button 
                onClick={generatePDF}
                className="bg-gradient-to-r from-nubinix-blue to-nubinix-purple hover:from-nubinix-purple hover:to-nubinix-pink"
              >
                Download PDF
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default GenerateReport;