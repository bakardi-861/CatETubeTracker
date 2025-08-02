import asyncio
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, send_file
from app.utils.export import report_generator
import io
import threading

report_bp = Blueprint('report', __name__)

# Store for async tasks
async_tasks = {}

def run_async_report(report_id, coro):
    """Run async coroutine in thread"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        result = loop.run_until_complete(coro)
        async_tasks[report_id] = {'status': 'completed', 'result': result}
    except Exception as e:
        async_tasks[report_id] = {'status': 'error', 'error': str(e)}
    finally:
        loop.close()

@report_bp.route('/feeding', methods=['POST'])
def generate_feeding_report():
    """Start async feeding report generation"""
    try:
        data = request.get_json() or {}
        
        # Parse parameters
        start_date = None
        end_date = None
        if data.get('start_date'):
            start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
        if data.get('end_date'):
            end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
            
        format_type = data.get('format', 'csv').lower()
        if format_type not in ['csv', 'json', 'excel']:
            return jsonify({'error': 'Invalid format. Use csv, json, or excel'}), 400
            
        # Generate unique report ID
        report_id = str(uuid.uuid4())
        
        # Start async task
        coro = report_generator.generate_feeding_report(
            start_date=start_date,
            end_date=end_date,
            format=format_type,
            report_id=report_id
        )
        
        thread = threading.Thread(target=run_async_report, args=(report_id, coro))
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'report_id': report_id,
            'status': 'processing',
            'message': 'Report generation started'
        }), 202
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@report_bp.route('/medication', methods=['POST'])
def generate_medication_report():
    """Start async medication report generation"""
    try:
        data = request.get_json() or {}
        
        start_date = None
        end_date = None
        if data.get('start_date'):
            start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
        if data.get('end_date'):
            end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
            
        format_type = data.get('format', 'csv').lower()
        if format_type not in ['csv', 'json', 'excel']:
            return jsonify({'error': 'Invalid format. Use csv, json, or excel'}), 400
            
        report_id = str(uuid.uuid4())
        
        coro = report_generator.generate_medication_report(
            start_date=start_date,
            end_date=end_date,
            format=format_type,
            report_id=report_id
        )
        
        thread = threading.Thread(target=run_async_report, args=(report_id, coro))
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'report_id': report_id,
            'status': 'processing',
            'message': 'Report generation started'
        }), 202
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@report_bp.route('/combined', methods=['POST'])
def generate_combined_report():
    """Start async combined report generation"""
    try:
        data = request.get_json() or {}
        
        start_date = None
        end_date = None
        if data.get('start_date'):
            start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
        if data.get('end_date'):
            end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
            
        format_type = data.get('format', 'csv').lower()
        if format_type not in ['csv', 'json', 'excel']:
            return jsonify({'error': 'Invalid format. Use csv, json, or excel'}), 400
            
        report_id = str(uuid.uuid4())
        
        coro = report_generator.generate_combined_report(
            start_date=start_date,
            end_date=end_date,
            format=format_type,
            report_id=report_id
        )
        
        thread = threading.Thread(target=run_async_report, args=(report_id, coro))
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'report_id': report_id,
            'status': 'processing',
            'message': 'Report generation started'
        }), 202
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@report_bp.route('/status/<report_id>', methods=['GET'])
def get_report_status(report_id):
    """Get status of async report generation"""
    try:
        # Check async task status
        if report_id in async_tasks:
            task_status = async_tasks[report_id]
            if task_status['status'] == 'completed':
                return jsonify({
                    'status': 'completed',
                    'ready_for_download': True
                })
            elif task_status['status'] == 'error':
                return jsonify({
                    'status': 'error',
                    'error': task_status['error']
                }), 500
                
        # Check progress from report generator
        progress = report_generator.get_progress(report_id)
        if progress['status'] == 'not_found':
            return jsonify({'error': 'Report not found'}), 404
            
        return jsonify(progress)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@report_bp.route('/download/<report_id>', methods=['GET'])
def download_report(report_id):
    """Download completed report"""
    try:
        if report_id not in async_tasks:
            return jsonify({'error': 'Report not found'}), 404
            
        task = async_tasks[report_id]
        if task['status'] != 'completed':
            return jsonify({'error': 'Report not ready for download'}), 400
            
        result = task['result']
        report_data = result['data']
        report_format = result['format']
        report_type = result['type']
        
        # Prepare file for download
        if report_format == 'csv':
            mimetype = 'text/csv'
            filename = f"{report_type}_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            file_obj = io.StringIO(report_data)
            
        elif report_format == 'json':
            mimetype = 'application/json'
            filename = f"{report_type}_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            file_obj = io.StringIO(report_data)
            
        elif report_format == 'excel':
            mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            filename = f"{report_type}_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            file_obj = io.BytesIO(report_data)
            
        else:
            return jsonify({'error': 'Unsupported format'}), 400
            
        # Cleanup task after successful download initiation
        del async_tasks[report_id]
        report_generator.cleanup_progress(report_id)
        
        # Send file
        file_obj.seek(0)
        return send_file(
            file_obj,
            mimetype=mimetype,
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@report_bp.route('/cleanup/<report_id>', methods=['DELETE'])
def cleanup_report(report_id):
    """Cleanup report data"""
    try:
        if report_id in async_tasks:
            del async_tasks[report_id]
        report_generator.cleanup_progress(report_id)
        
        return jsonify({'message': 'Report data cleaned up'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@report_bp.route('/active', methods=['GET'])
def get_active_reports():
    """Get list of active reports"""
    try:
        active_reports = []
        
        for report_id, task in async_tasks.items():
            progress = report_generator.get_progress(report_id)
            active_reports.append({
                'report_id': report_id,
                'status': task.get('status', progress.get('status', 'unknown')),
                'progress': progress.get('progress', 0)
            })
            
        return jsonify({'active_reports': active_reports})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500