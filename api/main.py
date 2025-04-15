
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from typing import List, Optional
from pydantic import BaseModel
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
import os
import tempfile
from datetime import datetime, timedelta
import pytz
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
import matplotlib.pyplot as plt

class Credentials(BaseModel):
    accessKeyId: str
    secretAccessKey: str
    region: Optional[str] = None
    accountId: Optional[str] = None

class Instance(BaseModel):
    id: str
    name: str
    type: str
    state: str
    region: str
    selected: bool = False

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def create_metric_graph(cloudwatch, instance_id, metric_name, namespace, unit, start_time, end_time, period=300):
    try:
        response = cloudwatch.get_metric_statistics(
            Namespace=namespace,
            MetricName=metric_name,
            Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
            StartTime=start_time,
            EndTime=end_time,
            Period=period,
            Statistics=['Average']
        )
        
        if response['Datapoints']:
            datapoints = sorted(response['Datapoints'], key=lambda x: x['Timestamp'])
            times = [d['Timestamp'] for d in datapoints]
            values = [d['Average'] for d in datapoints]
            
            plt.figure(figsize=(8, 4))
            plt.plot(times, values)
            plt.title(f"{metric_name} Over Time")
            plt.xlabel("Time")
            plt.ylabel(f"{metric_name} ({unit})")
            plt.xticks(rotation=45)
            plt.tight_layout()
            
            # Save to temp file
            temp_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
            plt.savefig(temp_file.name)
            plt.close()
            
            return temp_file.name, sum(values) / len(values)
    except Exception as e:
        print(f"Error getting metric {metric_name}: {str(e)}")
        return None, None
    
    return None, None

@app.post("/generate-report")
async def generate_report(provider: str, credentials: Credentials, selected_instances: List[Instance], frequency: str):
    try:
        # Calculate time period based on frequency
        now = datetime.now()
        if frequency == "daily":
            start_time = now - timedelta(days=1)
        elif frequency == "weekly":
            start_time = now - timedelta(weeks=1)
        else:  # monthly
            start_time = now - timedelta(days=30)

        session = boto3.Session(
            aws_access_key_id=credentials.accessKeyId,
            aws_secret_access_key=credentials.secretAccessKey,
            region_name=credentials.region or 'me-central-1'
        )

        # Initialize clients
        cloudwatch = session.client('cloudwatch')
        ec2 = session.client('ec2')
        rds = session.client('rds')

        # Create PDF
        doc = SimpleDocTemplate("report.pdf", pagesize=letter)
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Title'],
            textColor=colors.HexColor('#0078D4'),
            fontSize=24,
            spaceAfter=20
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=15
        )

        elements = []
        
        # Title and header
        elements.append(Paragraph("Nubinix Cloud Insights", title_style))
        elements.append(Paragraph(f"{frequency.capitalize()} Utilization Report - {provider.upper()}", heading_style))
        elements.append(Paragraph(f"Generated on: {now.strftime('%d/%m/%Y %H:%M:%S')}", styles['Normal']))
        elements.append(Spacer(1, 20))

        # Instance table
        elements.append(Paragraph("Selected Instances", heading_style))
        
        instance_data = [['Instance ID', 'Name', 'Type', 'Region']]
        for instance in selected_instances:
            instance_data.append([
                instance.id,
                instance.name,
                instance.type,
                instance.region
            ])
            
        instance_table = Table(instance_data)
        instance_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(instance_table)

        # Initialize AWS session
        session = boto3.Session(
            aws_access_key_id=credentials.accessKeyId,
            aws_secret_access_key=credentials.secretAccessKey,
            region_name=credentials.region or 'me-central-1'
        )
        cloudwatch = session.client('cloudwatch')
        
        # Create temporary directory for graphs
        temp_dir = tempfile.mkdtemp()
        pdf_path = os.path.join(temp_dir, f"cloud-report-{frequency}-{now.strftime('%Y%m%d')}.pdf")
        
        # Initialize PDF
        doc = SimpleDocTemplate(pdf_path, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []
        
        # Add title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Title'],
            fontSize=24,
            spaceAfter=30
        )
        elements.append(Paragraph("Cloud Infrastructure Report", title_style))
        elements.append(Spacer(1, 12))
        
        # Add report info
        report_info = [
            ["Report Type", f"{frequency.capitalize()} Utilization Report"],
            ["Cloud Provider", provider.upper()],
            ["Period", f"{start_time.strftime('%Y-%m-%d %H:%M')} to {now.strftime('%Y-%m-%d %H:%M')}"],
            ["Generated On", now.strftime("%Y-%m-%d %H:%M:%S")]
        ]
        
        info_table = Table(report_info, colWidths=[2*inch, 4*inch])
        info_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 20))
        
        # Process each instance
        for instance in selected_instances:
            elements.append(PageBreak())
            elements.append(Paragraph(f"Instance: {instance.name}", styles['Heading1']))
            elements.append(Spacer(1, 12))
            
            # Instance details table
            instance_details = [
                ["Property", "Value"],
                ["Instance ID", instance.id],
                ["Instance Type", instance.type],
                ["Region", instance.region],
                ["State", instance.state]
            ]
            
            details_table = Table(instance_details)
            details_table.setStyle(TableStyle([
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(details_table)
            elements.append(Spacer(1, 20))
            
            # Metrics section
            elements.append(Paragraph("Performance Metrics", styles['Heading2']))
            elements.append(Spacer(1, 12))
            
            metrics = {
                'CPUUtilization': {'namespace': 'AWS/EC2', 'unit': '%'},
                'MemoryUtilization': {'namespace': 'CWAgent', 'unit': '%'},
                'DiskUsedPercent': {'namespace': 'CWAgent', 'unit': '%'},
                'NetworkIn': {'namespace': 'AWS/EC2', 'unit': 'Bytes'},
                'NetworkOut': {'namespace': 'AWS/EC2', 'unit': 'Bytes'},
                'CPUCreditUsage': {'namespace': 'AWS/EC2', 'unit': 'Count'},
                'CPUCreditBalance': {'namespace': 'AWS/EC2', 'unit': 'Count'}
            }
            
            for metric_name, metric_info in metrics.items():
                graph_path, avg_value = create_metric_graph(
                    cloudwatch, 
                    instance.id,
                    metric_name,
                    metric_info['namespace'],
                    metric_info['unit'],
                    start_time,
                    now
                )
                
                if graph_path and avg_value is not None:
                    elements.append(Paragraph(f"{metric_name}: Average {avg_value:.2f} {metric_info['unit']}", styles['Normal']))
                    elements.append(Spacer(1, 12))
                    elements.append(Image(graph_path, width=6*inch, height=3*inch))
                    elements.append(Spacer(1, 12))
            
        # Build PDF
        doc.build(elements)
        
        return FileResponse(
            pdf_path,
            media_type='application/pdf',
            filename=f"cloud-report-{frequency}-{now.strftime('%Y%m%d')}.pdf"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Include other existing endpoints (validate-credentials, instances, etc.)
