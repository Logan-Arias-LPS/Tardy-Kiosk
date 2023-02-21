/**
 * TardyKiosk 1.1.16
 *
 * TardyKiosk Plugin for PowerSchool
 *
 * @link   URL
 * @file   Main Controller
 * @author Alex Wolfe
 * @since  1.0.0
 */

(function() {

  define(['angular', 'tardyKiosk/tardyModule', 'tardyKiosk/tardyService', 'tardyKiosk/tardyHistoryService'], function (angular) {
    angular
    .module('tardyModule')
    .controller('tardyController', tardyController)
    .directive('autofocus', ['$timeout', function($timeout) {
      return {
        restrict: 'A',
        link : function($scope, $element) {
          $timeout(function() {
            $element[0].focus();
          });
        }
      }
    }]);

    var $j = require('jquery');

    tardyController.$inject = ['tardyService', 'tardySettingsService', 'tardyHistoryService', '$scope', '$q', '$httpParamSerializer'];

    function tardyController(tardyService, tardySettingsService, tardyHistoryService, $scope, $q) {

      var vm = this;

      $scope.valid_input=function(e){
        if (!e ||e.length <= 0) { return true; } else {return false; }
      }
      vm.tardy = tardy;
      vm.comment = '';
      vm.existingAttendance = {dcid: '', att_code: '' };

      $j('#kiosk_main').click(function() {
         angular.element('#student_lookup').trigger('focus');
      });

      $j('#kiosk_history_tab').click(function() {
        tardyHistoryService.apply();
      });

      getSettings().then(function(settings) { vm.settings = settings; });

      $scope.$watch('vm.student_lookup', function(current, original) {
           vm.student_lookup = current;
       });
       $scope.$watch('vm.comment', function(current, original) {
            vm.comment = current;
        });

      function tardy() {


        if (vm.school_number == '0') { displayMessage('Tardy Kiosk can not be used at District Level'); return; }
        loadingDialog('Recording Tardy', 'tardy');
        getDate();

        getSettings()
        .then(function(settings) { return verifySettings(settings); })
        .then(function() { return getSection(); })
        .then(function() { return checkSection(); })
        .then(function() { return getOverrideSection(); })
        .then(function() { return prepareTardy(); })
        .then(function() { return checkAttendance(); })
        .then(function() { return submitTardy(); })
        .then(function(attendance) { return getClassTardyCount(attendance) })
        .then(function(attendance) { return getTotalTardyCount(attendance) })
        .then(function(attendance) { return recordTardy(attendance); })
        .then(function(attendance) { closeLoading('tardy'); switch(vm.settings.print_tardy_slip ) {
          case '2':
            printSlip(attendance);
            break;
          case '1':
            displayComplete(attendance);
            break;
          case '0':
            focusStudentNumber();
            break;
        } })
        .catch(function(error) { closeLoading('tardy'); if (error.message) { displayMessage(error.message, 'Error'); } })
      }

      function continueAfterWarning() {
        loadingDialog('Recording Tardy', 'tardy');

        submitTardy()
        .then(function(attendance) { return getClassTardyCount(attendance) })
        .then(function(attendance) { return getTotalTardyCount(attendance) })
        .then(function(attendance) { return recordTardy(attendance); })
        .then(function(attendance) { closeLoading('tardy'); switch(vm.settings.print_tardy_slip ) {
          case '2':
            printSlip(attendance);
            break;
          case '1':
            displayComplete(attendance);
            break;
          case '0':
            focusStudentNumber();
            break;
        } })
        .catch(function(error) { closeLoading('tardy'); if (error.message) { displayMessage(error.message, 'Error'); } });

      }

      function getDate()
      {
        if (vm.dates == null || vm.dates.datetime != new Date(new Date().setHours(0,0,0,0))) {
          myDate = new Date(new Date().setHours(0,0,0,0));
          fullYear = myDate.getFullYear();
          month = myDate.getMonth();
          date = myDate.getDate();

          vm.dates = {
            datetime: myDate,
            date: fullYear + "-" + (month+1) + "-" + date,
            queryDate: fullYear.toString() + "-" + (month+1).toString().padStart(2, '0') + "-" + date.toString().padStart(2, '0'),
            compactDate: fullYear.toString() + (month+1).toString().padStart(2, '0') + date.toString().padStart(2, '0'),
            viewDate: (month+1) + "/" + date + "/" + fullYear
          }
        }

      }

      function getSettings() {
        var settings = tardySettingsService.get();
        return $q.when(tardySettingsService.get());
      }

      function verifySettings(settings) {
        if (!settings) {
          return( $q.reject( new Error( "Please enter settings in Setup first." ) ) );
        }
        if (!settings.id_type) {
          return( $q.reject( new Error( "Please enter an ID Type in Setup first" ) ) );
        }
        if (!settings.tardy_code) {
          return( $q.reject( new Error( "Please enter a tardy code in Setup first" ) ) );
        }
        if (!settings.tardy_minutes) {
          return( $q.reject( new Error( "Please enter the amount of minutes until considered tardy in Setup first" ) ) );
        }
        if (settings.late_tardy_minutes && parseFloat(settings.tardy_minutes) > parseFloat(settings.late_tardy_minutes)) {
          return( $q.reject( new Error( "Minutes Until Considered Late Tardy setting must be greater than Minutes Until Considered Tardy setting." ) ) );
        }
        if (!settings.tardy_category) {
          return( $q.reject( new Error( "Please enter attendance code category used for tardies." ) ) );
        }
        if (!settings.total_tardies_by) {
          return( $q.reject( new Error( "Please enter the term to total tardies by." ) ) );
        }
        vm.settings = settings;
        return $q.when(true);

      }

      function getSection() {

        var midnight = new Date();
        current = new Date(midnight);
        var clockin = Math.round((current - midnight.setHours(0,0,0,0))/1000);
        var tardy_minutes = (vm.settings.user.tardy_minutes) ? vm.settings.user.tardy_minutes : vm.settings.tardy_minutes;
        if (parseFloat(tardy_minutes) < 0 ) {
          clockin = clockin + (Math.abs(tardy_minutes)*60);
        }
        return tardyService.getSection(vm.student_lookup, vm.school_number, clockin, vm.dates.queryDate)
           .then(function(results) {
             if (results.data.record) {
               vm.section = results.data.record[0];
               return vm.section;
             } else {
               vm.section = '';
               return $q.reject(new Error( "Student does not have class at this time." ));
             }
        });
      }

      function checkSection() {
        if (parseFloat(vm.settings.tardy_minutes) >= 0 ) {
          if (parseFloat(vm.section.minutes_late) >= parseFloat(vm.settings.tardy_minutes)) {
            return true;
          } else {
            return $q.reject(new Error("Student not currently tardy. Student is only "+vm.section.minutes_late+" minutes late."));
          }
        } else {
          if (parseFloat(vm.section.minutes_late) >= 0) {
            return true;
          } else {
            return $q.reject(new Error("Student not currently tardy. Student is only "+vm.section.minutes_late+" minutes late."));
          }
        }

      }

      function getOverrideSection() {

        if (!vm.settings.period_override) { return true; }

        return tardyService.getOverrideSection(vm.section.studentsdcid, vm.school_number, vm.dates.queryDate, vm.settings.period_override)
           .then(function(results) {
             if (results.data.record) {
               vm.override_section = results.data.record[0];
               return vm.override_section;
             } else {
               vm.override_section = '';
               return $q.reject(new Error( "Can't find Period Override section." ));
             }
        });
      }

      function checkAttendance() {
        return tardyService.checkAttendance(vm.dates.date,  (vm.override_section) ? vm.override_section: vm.section)
          .then(function(results) {
            if (results.data.record) {
              vm.existingAttendance = results.data.record[0];
              if (vm.settings.existing_attendance_warning) {
                warnExistingAttendance();
                return( $q.reject( new Error( "" ) ) );
              }
            } else {
              vm.existingAttendance = {dcid: '', att_code: '' };
            }
          });
      }


      function prepareTardy() {
        return tardyService.prepareTardy(vm.section)
          .then(function(results) {
            return results;
          });
      }

      function submitTardy() {
        var comment = (vm.comment.length > 0) ? vm.comment : vm.settings.default_comment;
        myDate = new Date();
        slip_dates = {date: (myDate.getMonth()+1) + "/" + myDate.getDate() + "/" + myDate.getFullYear(), time: myDate.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })};
        return tardyService.submitTardy(vm.existingAttendance, vm.section.minutes_late, (vm.override_section) ? vm.override_section: vm.section, vm.dates, vm.settings, comment, slip_dates)
          .then(function(results) {
            return results;
          });
      }

      function recordTardy(attendance) {
        vm.tardy_def = attendance.tardy;
        return tardyService.recordTardy(vm.section.student_number, vm.section, attendance)
          .then(function(results) {
            return attendance;
        });
      }

      function getClassTardyCount(attendance) {
        return tardyService.tardyCount(vm.section.student_number, vm.settings.schoolsdcid, (vm.override_section) ? vm.override_section.ccid : vm.section.ccid, vm.settings.total_tardies_by, vm.settings.tardy_category)
          .then(function(results) {
            attendance.class_tardy_count = results;
            return attendance;
          });
      }

      function getTotalTardyCount(attendance) {
        return tardyService.tardyCount(vm.section.student_number, vm.settings.schoolsdcid, null, vm.settings.total_tardies_by, vm.settings.tardy_category)
          .then(function(results) {
            attendance.total_tardy_count = results;
            return attendance;
          });
      }

      function printSlip(attendance) {
          window.open('/admin/tardy_kiosk/tardy_slip.html?student_number='+vm.section.student_number+'&name='+vm.section.first_name+' '+vm.section.last_name+'&teacher='+vm.section.teachers_first_name+' '+vm.section.teachers_last_name+'&class='+vm.section.course_name+' '+vm.section.expression+'&class_tardy_count='+attendance.class_tardy_count+'&total_tardy_count='+attendance.total_tardy_count+'&comment='+((attendance.comment) ? attendance.comment : '')+'&slip_disable_comment='+((vm.settings.slip_disable_comment) ? '1' : '0')+'&footer='+((vm.settings.footer != null) ? vm.settings.footer : '')+'&header='+((vm.settings.header != null) ? vm.settings.header : '')+'&code='+vm.tardy_def.code+' - '+vm.tardy_def.description+'&date='+attendance.slip_dates.date+' '+attendance.slip_dates.time, "tardySlipFrame", "width=350,height=300");
          focusStudentNumber();
      }

      function focusStudentNumber(keep_values = false) {
        if (!keep_values) {
          vm.comment = '';
          vm.student_lookup = '';
        }
        angular.element('#student_lookup').trigger('focus');
      }

      function displayComplete(attendance) {
        psDialog({
            dialogClass: 'confirmDeleteDialog',
            width: 400,
            type: 'dialogM',
            resizable: false,
            title: 'Success',
            content: '<div style="text-align: center;">Student has been marked Tardy for <b>'+vm.section.expression+' '+vm.section.course_name+'</b></div>',
            buttons: [
              {
                text: 'Ok',
                id:'confirm',
                width: '75px',
                height: '30px',
                click: function(){ psDialogClose(); focusStudentNumber(); $scope.$apply(); }
              },
              {
                text: 'Print Tardy Slip',
                id:'print_slip',
                click: function(){ printSlip(attendance);  $scope.$apply(); psDialogClose(); }
              }
            ]
        });
      }

      function warnExistingAttendance() {
        psDialog({
          dialogClass: 'confirmDeleteDialog',
          width: 400,
          type: 'dialogM',
          resizable: false,
          title: 'Attendance Warning',
          content: '<div style="text-align: center;">Student has already been marked <b>'+vm.existingAttendance.att_code+'</b> for this class. <br />Overwrite with Tardy?</div>',
          buttons: [
            {
              text: 'Confirm',
              id:'confirm',
              width: '75px',
              height: '30px',
              click:  function() { continueAfterWarning(); psDialogClose(); }
            },
            {
            text: 'Cancel',
            id:'cancel',
            width: '75px',
            height: '30px',
            click: function() { psDialogClose(); focusStudentNumber(); $scope.$apply();  }
            }
          ]
        });
        return false;
      }

      function displayMessage(message, type='Warning') {
        psDialog({
          dialogClass: 'confirmDeleteDialog',
          width: 400,
          type: 'dialogM',
          resizable: false,
          title: type,
          content: '<div style="text-align: center;">'+message+'</div>',
          buttons: [
            {
              text: 'Ok',
              width: '75px',
              height: '30px',
              click:  function() { psDialogClose(); focusStudentNumber(true); $scope.$apply(); }
            }
          ]
        });
        return false;
      }
   	}
  });

})();
