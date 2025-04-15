import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { ReportConfig, Instance, RDSInstance } from "@/types";
import { Chart, ChartConfiguration } from 'chart.js/auto';

export class PDFService {
  private doc: jsPDF;
  private pageWidth: number;
  private margin: number;
  private yPos: number;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.margin = 20;
    this.yPos = this.margin;
  }

  private async createMetricChart(data: number[], labels: string[], title: string): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 300;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: title,
          data,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      },
      options: {
        responsive: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });

    return canvas.toDataURL();
  }

  private addHeader() {
    const logoPath = '/images/nubinix_logo.jpg';
    this.doc.addImage(logoPath, 'JPEG', this.pageWidth - 40, 10, 30, 15);
    this.doc.setFontSize(8);
    this.doc.text("www.nubinix.com", this.margin, 10);

    const width = this.doc.internal.pageSize.getWidth();
    const height = this.doc.internal.pageSize.getHeight();
    this.doc.setLineWidth(0.5);
    this.doc.rect(10, 10, width - 20, height - 20);
  }

  private async addMetricsPage(instance: Instance | RDSInstance, metrics: any) {
    this.doc.addPage();
    this.yPos = 30;

    // Instance Info
    const instanceInfo = [
      ["Instance ID", instance.id],
      ["Type", instance.type],
      ["Status", instance.state]
    ];

    if ('engine' in instance) {
      instanceInfo.push(["Engine", instance.engine]);
    }

    autoTable(this.doc, {
      body: instanceInfo,
      theme: 'plain',
      startY: this.yPos,
      styles: { fontSize: 10 }
    });

    this.yPos = this.doc.lastAutoTable.finalY + 20;

    // Sample metrics data (replace with actual metrics)
    const timeLabels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];

    // CPU Chart
    const cpuData = [25, 45, 65, 35, 55, 40];
    const cpuChart = await this.createMetricChart(cpuData, timeLabels, 'CPU Utilization (%)');
    this.doc.addImage(cpuChart, 'PNG', this.margin, this.yPos, 170, 80);
    this.yPos += 90;

    // Memory Chart
    const memoryData = [30, 50, 70, 40, 60, 45];
    const memoryChart = await this.createMetricChart(memoryData, timeLabels, 'Memory Usage (%)');
    this.doc.addImage(memoryChart, 'PNG', this.margin, this.yPos, 170, 80);
    this.yPos += 90;

    // Disk Chart
    const diskData = [20, 40, 60, 30, 50, 35];
    const diskChart = await this.createMetricChart(diskData, timeLabels, 'Disk Usage (%)');
    this.doc.addImage(diskChart, 'PNG', this.margin, this.yPos, 170, 80);

    this.addHeader();
  }

  public async generateReport(reportConfig: ReportConfig, accountName: string): Promise<string> {
    this.addCoverPage(reportConfig); //Preserving the original cover page function

    // Add metrics pages for each instance
    for (const instance of reportConfig.instances) {
      await this.addMetricsPage(instance, {
        cpu: { average: 15 }, // Replace with actual metrics
        memory: { average: 45 },
        disk: { average: 60 }
      });
    }

    // Add metrics pages for RDS instances
    if (reportConfig.rdsInstances) {
      for (const instance of reportConfig.rdsInstances) {
        await this.addMetricsPage(instance, {
          cpu: { average: 20 },
          memory: { average: 40 },
          disk: { average: 55 }
        });
      }
    }

    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `${accountName.replace(/\s+/g, '-')}-${currentDate}.pdf`;
      this.doc.save(filename);
      return filename;
    } catch (error) {
      console.error('Error saving PDF:', error);
      throw new Error('Failed to generate PDF file');
    }
  }

  private addCoverPage(reportConfig: ReportConfig) {
    this.doc.setFontSize(24);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text("CLOUD UTILIZATION", this.pageWidth / 2, 50, { align: "center" });
    this.doc.text("REPORT", this.pageWidth / 2, 65, { align: "center" });

    const reportInfo = [
      ["Account", `Manapuram LOS ${reportConfig.provider.toUpperCase()}`],
      ["Report", "Resource Utilization"],
      ["Cloud Provider", reportConfig.provider.toUpperCase()],
      ["Account ID", reportConfig.accountId || ""],
      ["Date", new Date().toISOString().split('T')[0]]
    ];

    autoTable(this.doc, {
      body: reportInfo,
      theme: 'plain',
      startY: 90,
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { cellWidth: 100 }
      }
    });

    // Add instances table
    this.doc.setFontSize(12);
    this.doc.text("Instances Covered in Report:", this.margin, 150);

    const instancesData = reportConfig.instances.map(instance => [
      instance.id,
      instance.name,
      instance.type,
      instance.state
    ]);

    autoTable(this.doc, {
      head: [["Instance ID", "Name", "Type", "Status"]],
      body: instancesData,
      startY: 160,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0] }
    });

    // Add RDS instances table
    if (reportConfig.rdsInstances && reportConfig.rdsInstances.length > 0) {
      this.doc.text("RDS Instances Covered in Report:", this.margin, this.doc.lastAutoTable.finalY + 20);

      const rdsData = reportConfig.rdsInstances.map(instance => [
        instance.name,
        instance.type,
        instance.state,
        instance.engine
      ]);

      autoTable(this.doc, {
        head: [["Instance Name", "Type", "Status", "Engine"]],
        body: rdsData,
        startY: this.doc.lastAutoTable.finalY + 30,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0] }
      });
    }

    this.addHeader();
  }
}

export const pdfService = new PDFService();