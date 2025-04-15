
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Layout from "@/components/Layout";
import Stepper from "@/components/Stepper";
import { useReport } from "@/context/ReportContext";
import { jsPDF } from "jspdf";
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

const steps = ["Cloud Provider", "Credentials", "Instances", "Report Type", "Generate"];

const GenerateReport = () => {
  const navigate = useNavigate();
  const { reportConfig, resetReport } = useReport();
  const [isGenerating, setIsGenerating] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;
    
    // Add logo
    // This would typically use an image, but for simplicity we'll just add text
    doc.setFontSize(24);
    doc.setTextColor(0, 120, 212);
    doc.text("Nubinix Cloud Insights", pageWidth / 2, yPos, { align: "center" });
    yPos += 15;
    
    // Add report title
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`${reportConfig.frequency.charAt(0).toUpperCase() + reportConfig.frequency.slice(1)} Report - ${reportConfig.provider.toUpperCase()}`, pageWidth / 2, yPos, { align: "center" });
    yPos += 20;
    
    // Add date
    const date = new Date();
    doc.setFontSize(12);
    doc.text(`Generated on: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`, margin, yPos);
    yPos += 15;
    
    // Add instances section
    doc.setFontSize(14);
    doc.setTextColor(70, 70, 70);
    doc.text("Selected Instances", margin, yPos);
    yPos += 10;
    
    // Add instance table headers
    doc.setFontSize(10);
    doc.text("Instance ID", margin, yPos);
    doc.text("Name", margin + 65, yPos);
    doc.text("Type", margin + 130, yPos);
    doc.text("Region", margin + 160, yPos);
    yPos += 5;
    
    // Add line under headers
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;
    
    // Add instance rows
    doc.setFontSize(9);
    reportConfig.instances.forEach(instance => {
      doc.text(instance.id, margin, yPos);
      doc.text(instance.name, margin + 65, yPos);
      doc.text(instance.type, margin + 130, yPos);
      doc.text(instance.region, margin + 160, yPos);
      yPos += 7;
      
      // Check if we need a new page
      if (yPos > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }
    });
    
    // Add RDS instances if any
    if (reportConfig.rdsInstances.length > 0) {
      yPos += 10;
      
      // Add RDS section title
      doc.setFontSize(14);
      doc.setTextColor(70, 70, 70);
      doc.text("Selected Database Instances", margin, yPos);
      yPos += 10;
      
      // Add RDS table headers
      doc.setFontSize(10);
      doc.text("Instance ID", margin, yPos);
      doc.text("Name", margin + 65, yPos);
      doc.text("Engine", margin + 130, yPos);
      doc.text("Region", margin + 160, yPos);
      yPos += 5;
      
      // Add line under headers
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;
      
      // Add RDS rows
      doc.setFontSize(9);
      reportConfig.rdsInstances.forEach(instance => {
        doc.text(instance.id, margin, yPos);
        doc.text(instance.name, margin + 65, yPos);
        doc.text(instance.engine, margin + 130, yPos);
        doc.text(instance.region, margin + 160, yPos);
        yPos += 7;
        
        // Check if we need a new page
        if (yPos > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
        }
      });
    }
    
    // Add a new page for performance metrics
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
    
    // Save the PDF
    doc.save(`nubinix-cloud-insights-${reportConfig.provider}-${reportConfig.frequency}.pdf`);
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
                    Your {reportConfig?.frequency} report for {reportConfig?.provider.toUpperCase()} is ready to download.
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
                        The report includes data for {reportConfig?.instances.length} instances and {reportConfig?.rdsInstances.length} databases.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sample charts that would be included in the report */}
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
