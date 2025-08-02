import asyncio
import csv
import json
import io
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union
import pandas as pd
from app.models import FeedingLog, MedicationLog
from app import db


class AsyncReportGenerator:
    """Async report generator for feeding and medication data"""
    
    def __init__(self):
        self.progress = {}
        
    async def generate_feeding_report(
        self, 
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        format: str = 'csv',
        report_id: str = None
    ) -> Dict:
        """Generate feeding report asynchronously"""
        if report_id:
            self.progress[report_id] = {'status': 'processing', 'progress': 0}
            
        try:
            # Simulate progress update
            if report_id:
                await asyncio.sleep(0.1)
                self.progress[report_id]['progress'] = 20
                
            # Query feeding data
            query = FeedingLog.query
            if start_date:
                query = query.filter(FeedingLog.time_given >= start_date)
            if end_date:
                query = query.filter(FeedingLog.time_given <= end_date)
                
            feeding_logs = query.order_by(FeedingLog.time_given.desc()).all()
            
            if report_id:
                self.progress[report_id]['progress'] = 60
                await asyncio.sleep(0.1)
                
            # Convert to dict format
            data = [log.to_dict() for log in feeding_logs]
            
            if report_id:
                self.progress[report_id]['progress'] = 80
                await asyncio.sleep(0.1)
                
            # Generate report based on format
            if format.lower() == 'csv':
                report_data = await self._generate_csv_report(data, 'feeding')
            elif format.lower() == 'json':
                report_data = await self._generate_json_report(data, 'feeding')
            elif format.lower() == 'excel':
                report_data = await self._generate_excel_report(data, 'feeding')
            else:
                raise ValueError(f"Unsupported format: {format}")
                
            if report_id:
                self.progress[report_id] = {'status': 'completed', 'progress': 100}
                
            return {
                'data': report_data,
                'format': format,
                'type': 'feeding',
                'record_count': len(data),
                'generated_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            if report_id:
                self.progress[report_id] = {'status': 'error', 'error': str(e)}
            raise
            
    async def generate_medication_report(
        self, 
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        format: str = 'csv',
        report_id: str = None
    ) -> Dict:
        """Generate medication report asynchronously"""
        if report_id:
            self.progress[report_id] = {'status': 'processing', 'progress': 0}
            
        try:
            if report_id:
                await asyncio.sleep(0.1)
                self.progress[report_id]['progress'] = 20
                
            # Query medication data
            query = MedicationLog.query
            if start_date:
                query = query.filter(MedicationLog.time_given >= start_date)
            if end_date:
                query = query.filter(MedicationLog.time_given <= end_date)
                
            medication_logs = query.order_by(MedicationLog.time_given.desc()).all()
            
            if report_id:
                self.progress[report_id]['progress'] = 60
                await asyncio.sleep(0.1)
                
            data = [log.to_dict() for log in medication_logs]
            
            if report_id:
                self.progress[report_id]['progress'] = 80
                await asyncio.sleep(0.1)
                
            if format.lower() == 'csv':
                report_data = await self._generate_csv_report(data, 'medication')
            elif format.lower() == 'json':
                report_data = await self._generate_json_report(data, 'medication')
            elif format.lower() == 'excel':
                report_data = await self._generate_excel_report(data, 'medication')
            else:
                raise ValueError(f"Unsupported format: {format}")
                
            if report_id:
                self.progress[report_id] = {'status': 'completed', 'progress': 100}
                
            return {
                'data': report_data,
                'format': format,
                'type': 'medication',
                'record_count': len(data),
                'generated_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            if report_id:
                self.progress[report_id] = {'status': 'error', 'error': str(e)}
            raise
            
    async def generate_combined_report(
        self, 
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        format: str = 'csv',
        report_id: str = None
    ) -> Dict:
        """Generate combined feeding and medication report asynchronously"""
        if report_id:
            self.progress[report_id] = {'status': 'processing', 'progress': 0}
            
        try:
            # Generate both reports concurrently
            feeding_task = self.generate_feeding_report(start_date, end_date, format)
            medication_task = self.generate_medication_report(start_date, end_date, format)
            
            if report_id:
                self.progress[report_id]['progress'] = 30
                await asyncio.sleep(0.1)
                
            feeding_report, medication_report = await asyncio.gather(
                feeding_task, medication_task
            )
            
            if report_id:
                self.progress[report_id]['progress'] = 80
                await asyncio.sleep(0.1)
                
            # Combine the reports
            combined_data = await self._combine_reports(feeding_report, medication_report, format)
            
            if report_id:
                self.progress[report_id] = {'status': 'completed', 'progress': 100}
                
            return {
                'data': combined_data,
                'format': format,
                'type': 'combined',
                'feeding_records': feeding_report['record_count'],
                'medication_records': medication_report['record_count'],
                'generated_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            if report_id:
                self.progress[report_id] = {'status': 'error', 'error': str(e)}
            raise
            
    async def _generate_csv_report(self, data: List[Dict], report_type: str) -> str:
        """Generate CSV format report"""
        await asyncio.sleep(0.05)  # Simulate processing
        
        if not data:
            return ""
            
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
        
        return output.getvalue()
        
    async def _generate_json_report(self, data: List[Dict], report_type: str) -> str:
        """Generate JSON format report"""
        await asyncio.sleep(0.05)  # Simulate processing
        
        return json.dumps({
            'report_type': report_type,
            'generated_at': datetime.utcnow().isoformat(),
            'data': data
        }, indent=2)
        
    async def _generate_excel_report(self, data: List[Dict], report_type: str) -> bytes:
        """Generate Excel format report"""
        await asyncio.sleep(0.1)  # Simulate processing
        
        if not data:
            # Return empty Excel file
            output = io.BytesIO()
            pd.DataFrame().to_excel(output, index=False, engine='openpyxl')
            return output.getvalue()
            
        df = pd.DataFrame(data)
        output = io.BytesIO()
        df.to_excel(output, index=False, engine='openpyxl', sheet_name=f'{report_type}_data')
        
        return output.getvalue()
        
    async def _combine_reports(self, feeding_report: Dict, medication_report: Dict, format: str) -> Union[str, bytes]:
        """Combine feeding and medication reports"""
        await asyncio.sleep(0.1)  # Simulate processing
        
        if format.lower() == 'csv':
            combined = f"# Feeding Data\n{feeding_report['data']}\n\n# Medication Data\n{medication_report['data']}"
            return combined
        elif format.lower() == 'json':
            combined_data = {
                'report_type': 'combined',
                'generated_at': datetime.utcnow().isoformat(),
                'feeding_data': json.loads(feeding_report['data'])['data'],
                'medication_data': json.loads(medication_report['data'])['data']
            }
            return json.dumps(combined_data, indent=2)
        elif format.lower() == 'excel':
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                # Parse feeding data
                feeding_data = json.loads(feeding_report['data'])['data'] if feeding_report['format'] == 'json' else []
                medication_data = json.loads(medication_report['data'])['data'] if medication_report['format'] == 'json' else []
                
                if feeding_data:
                    pd.DataFrame(feeding_data).to_excel(writer, sheet_name='Feeding', index=False)
                if medication_data:
                    pd.DataFrame(medication_data).to_excel(writer, sheet_name='Medication', index=False)
                    
            return output.getvalue()
            
    def get_progress(self, report_id: str) -> Dict:
        """Get progress of report generation"""
        return self.progress.get(report_id, {'status': 'not_found'})
        
    def cleanup_progress(self, report_id: str):
        """Cleanup progress tracking for completed reports"""
        if report_id in self.progress:
            del self.progress[report_id]


# Global instance
report_generator = AsyncReportGenerator()