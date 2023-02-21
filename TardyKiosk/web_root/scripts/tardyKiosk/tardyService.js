(function() {
  define(['angular', 'tardyKiosk/tardyModule'], function (angular) {
    angular
    .module('tardyModule')
    .factory('tardyService', tardyService);

    tardyService.$inject = ['$http', '$httpParamSerializer'];

    function tardyService($http, $httpParamSerializer) {

      var service = {
        getSection: getSection,
        getOverrideSection: getOverrideSection,
        checkAttendance: checkAttendance,
        submitTardy: submitTardy,
        recordTardy: recordTardy,
        prepareTardy: prepareTardy,
        tardyCount: tardyCount
      };

      return service;

      function getSection(student_lookup, school_number, clockin, current_date) {

        var url = "/ws/schema/query/com.k12northstar.tardykiosk.current_section";
        var payload = { student_lookup: student_lookup, school_number: school_number, clockin: clockin, current_date: current_date };
        return $http.post (
          url,
          payload,
          { headers:{'Content-Type':'application/json'}}
        )
        .then(getSectionComplete)
        .catch(getSectionError);

        function getSectionComplete(response) {
          return response;
        }

        function getSectionError(error) {
          return Promise.reject(error)
        }
      }

      function getOverrideSection(studentsdcid, school_number, current_date, periodid) {

        var url = "/ws/schema/query/com.k12northstar.tardykiosk.override_section";
        var payload = { studentsdcid: studentsdcid, school_number: school_number, current_date: current_date, periodid: periodid };
        return $http.post (
          url,
          payload,
          { headers:{'Content-Type':'application/json'}}
        )
        .then(getOverrideSectionComplete)
        .catch(getOverrideSectionError);

        function getOverrideSectionComplete(response) {
          return response;
        }

        function getOverrideSectionError(error) {
          return Promise.reject(error)
        }
      }

      function checkAttendance(date, section, settings) {

        var url = "/ws/schema/query/com.k12northstar.tardykiosk.meeting_exists";
        var payload = {
          ccid: section.ccid,
          periodid: section.periodid,
          studentid: section.studentid,
          att_date: date
        }
        return $http.post (
          url,
          payload,
          { headers:{'Content-Type':'application/json'}}
        )
        .then(checkAttendanceComplete)
        .catch(checkAttendanceError);

        function checkAttendanceComplete(response) {
          return response;
        }

        function checkAttendanceError(error) {
          return Promise.reject(error)
        }
      }


      function prepareTardy(section) {

        var url = "/admin/attendance/record/week/meeting.html?frn=001"+section.studentsdcid
        return $http.get (
          url,
          { headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'}}

        )
        .then(prepareTardyComplete)
        .catch(prepareTardyError)

        function prepareTardyComplete(response) {
          return true;
        }

        function prepareTardyError(error) {
          return Promise.reject(error)
        }

      }

      function submitTardy(existingAttendance, minutes_late, section, dates, settings, comment_value, slip_dates) {

        var attend = '';
        var comment = '';
        var tardy_code_def = (settings.user.tardy_code_def) ? settings.user.tardy_code_def : settings.tardy_code_def;
        var late_tardy_code_def = (settings.user.late_tardy_code_def) ? settings.user.late_tardy_code_def : settings.late_tardy_code_def;
        var tardy_minutes = (settings.user.tardy_minutes) ? settings.user.tardy_minutes : settings.tardy_minutes;
        var late_tardy_minutes = (settings.user.late_tardy_minutes) ? settings.user.late_tardy_minutes : settings.late_tardy_minutes;

        // If doing Negative minutes late, find the "actual" minutes late.
        if (parseInt(tardy_minutes) < 0) {
          minutes_late = parseInt(minutes_late) + parseInt(tardy_minutes);
        }

        if (existingAttendance.dcid) { attend = 'MOD'; } else { attend = 'NEW'; }
        // Base Code make up of date + period + CC record + Student ID + Total Minutes the class is + dcid of existing attendance
        var base = dates.compactDate+section.periodid.padStart(10, '0')+section.ccid.padStart(13, '0')+section.studentid.padStart(10, '0')+section.total_minutes.padStart(4, '0')+existingAttendance.dcid.padStart(10, '0');
        attend = attend+base;
        comment = 'COM'+base;
        if (comment_value) {
          comment_value = comment_value.replace('{checkindate}', slip_dates.date);
          comment_value = comment_value.replace('{checkintime}', slip_dates.time);
          comment_value = comment_value.replace('{checkindatetime}', slip_dates.date+' '+slip_dates.time);
        }
        var tardy_code = (parseInt(minutes_late) >= late_tardy_minutes && late_tardy_code_def) ? late_tardy_code_def: tardy_code_def;
        var url = "/admin/attendance/record/week/meeting.html?frn=001"+section.studentsdcid+"&ATT_RecordMode=ATT_ModeMeeting";
        var payload = {
          Att_Mode_Code: 'ATT_ModeMeeting',
          studentId: section.studentid,
          ac: 'att_recordforweek',
          [attend]: tardy_code.code,
          [comment]: comment_value,
          startDate: dates.viewDate,
          endDate: dates.viewDate,
          savecomments: '1',
          counter: 0
        }
        return $http.post (
          url,
          $httpParamSerializer(payload),
          { headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'}}

        )
        .then(function() { return submitTardyComplete(section, dates.date); })
        .catch(submitTardyError);

        function submitTardyComplete(section,date) {
          var url = "/ws/schema/query/com.k12northstar.tardykiosk.meeting_exists";
          var payload = {
          ccid: section.ccid,
          periodid: section.periodid,
          studentid: section.studentid,
          att_date: date
        }
          return $http.post (
            url,
            payload,
            { headers:{'Content-Type':'application/json'}}
          )
          .then(validateTardyComplete)
          .catch(validateTardyError);

          function validateTardyComplete(response) {
            //Check to see if the Attendance saved
            if (!response.data.record[0].att_code || response.data.record[0].att_code != tardy_code.code) {
              return Promise.reject(new Error('Failed to record Attendance, Please try again.'));
            }
            return {tardy: tardy_code, comment: comment_value, slip_dates: slip_dates};
          }

          function validateTardyError(error) {
            return Promise.reject(error)
          }
        }

        function submitTardyError(error) {
         return Promise.reject(error)
        }
      }

      function recordTardy(student_number, section, attendance) {

        myDate = new Date();
        var url = "/ws/schema/table/U_TARDIES";

        var payload = {
          tables:{
            u_tardies:{
             studentsdcid:section.studentsdcid,
             cc_id: section.ccid,
             message: attendance.comment,
             school_id: section.schoolid,
             term_id: section.termid,
             att_code_id: attendance.tardy.id,
             student_id: section.studentid,
             period_id: section.periodid,
             date_entered: myDate.getTime().toString(),
             class_tardy_count: attendance.class_tardy_count,
             total_tardy_count: attendance.total_tardy_count
           }
         }
        };
        return $http.post (
          url,
          payload,
          { headers:{'Content-Type':'application/json'}}
        )
        .then(recordTardyComplete)
        .catch(recordTardyError);

        function recordTardyComplete(response) {
          return response;
        }

        function recordTardyError(error) {
          return Promise.reject(error)
        }

      }

      function tardyCount(student_number, schoolsdcid, ccid, term_portion, tardy_category) {
        var url = "/ws/schema/query/com.k12northstar.tardykiosk.tardy_count";
        var payload = { student_number: student_number, schoolsdcid: schoolsdcid, modecode: 'ATT_ModeMeeting', term_portion: term_portion, tardy_category: tardy_category };
        if (ccid) { payload.ccid = ccid; }
        return $http.post (
          url,
          payload,
          { headers:{'Content-Type':'application/json'}}
        )
        .then(tardyCountComplete)
        .catch(tardyCountError);

        function tardyCountComplete(response) {
          if (!response.data.record[0]) { return 0; } else { return response.data.record[0].tardycount; }
        }

        function tardyCountError(error) {
          return Promise.reject(error)
        }

      }

    }

  });
})();
