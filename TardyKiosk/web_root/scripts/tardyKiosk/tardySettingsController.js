(function() {

  define(['angular', 'tardyKiosk/tardyModule', 'tardyKiosk/tardySettingsService'], function (angular) {
    angular
    .module('tardyModule')
    .controller('tardySettingsController', tardySettingsController);

    tardySettingsController.$inject = ['tardySettingsService', '$scope', '$q', '$httpParamSerializer'];

    function tardySettingsController(tardySettingsService, $scope, $q) {
      var vm = this;

      vm.save = save;
      vm.get = get;
      vm.testPrint = testPrint;
      vm.init = init;
      vm.clearTempSettings = clearTempSettings;
      vm.settings = {user: {}};


      $scope.$watch('vm.settings.schoolsdcid', function(current, original) {
        vm.settings.schoolsdcid = current;
      });
      $scope.$watch('vm.settings.id_type', function(current, original) {
        vm.settings.id_type = current;
      });
      $scope.$watch('vm.settings.tardy_code', function(current, original) {
        vm.settings.tardy_code = current;
      });
      $scope.$watch('vm.settings.late_tardy_code', function(current, original) {
        vm.settings.late_tardy_code = current;
      });
      $scope.$watch('vm.settings.tardy_minutes', function(current, original) {
        vm.settings.tardy_minutes = current;
      });
      $scope.$watch('vm.settings.late_tardy_minutes', function(current, original) {
        vm.settings.late_tardy_minutes = current;
      });
      $scope.$watch('vm.settings.default_comment', function(current, original) {
        vm.settings.default_comment = current;
      });
      $scope.$watch('vm.settings.print_tardy_slip', function(current, original) {
        vm.settings.print_tardy_slip = current;
      });
      $scope.$watch('vm.settings.existing_attendance_warning', function(current, original) {
        vm.settings.existing_attendance_warning = current;
      });
      $scope.$watch('vm.settings.footer', function(current, original) {
        vm.settings.footer = current;
      });
      $scope.$watch('vm.settings.header', function(current, original) {
        vm.settings.header = current;
      });
      $scope.$watch('vm.settings.total_tardies_by', function(current, original) {
        vm.settings.total_tardies_by = current;
      });
      $scope.$watch('vm.settings.user.tardy_code', function(current, original) {
        vm.settings.user.tardy_code = current;
        tardySettingsService.setAttendanceCodeDef();
      });
      $scope.$watch('vm.settings.user.late_tardy_code', function(current, original) {
        vm.settings.user.late_tardy_code = current;
        tardySettingsService.setAttendanceCodeDef();
      });
      $scope.$watch('vm.settings.user.tardy_minutes', function(current, original) {
        vm.settings.user.tardy_minutes = current;
      });
      $scope.$watch('vm.settings.user.late_tardy_minutes', function(current, original) {
        vm.settings.user.late_tardy_minutes = current;
      });
      $scope.$watch('vm.settings.disable_comment', function(current, original) {
        vm.settings.disable_comment = current;
      });
      $scope.$watch('vm.settings.period_override', function(current, original) {
        vm.settings.period_override = current;
      });
      $scope.$watch('vm.settings.slip_disable_comment', function(current, original) {
        vm.settings.slip_disable_comment = current;
      });

      function save() {
        if (vm.settings.school_number == '0') { return false; }
        loadingDialog('Saving Settings', 'settings');

        return tardySettingsService.save(vm.settings)
          .then(function(results) {
            closeLoading('settings');
            return results;
          });
      }



      function get() {
        if (vm.settings.school_number == '0') { return false; }

        tardySettingsService.get(vm.settings.schoolsdcid).then(function(res) {
           if (res) {
             vm.settings = angular.extend(vm.settings, res);
             if (typeof vm.settings.footer === 'undefined') {
               vm.settings.footer = '';
             }
             if (typeof vm.settings.header === 'undefined') {
               vm.settings.header = '';
             }
           }
        });
      }

      function init() {
        tardySettingsService.attendanceCodes(vm.settings.schoolsdcid).then(function(res) {
          vm.settings.attendanceCodes = res.data.record;
        }).then(function() {
          return tardySettingsService.attendanceCategories(vm.settings.schoolsdcid);
        }).then(function(res) {
          vm.settings.attendanceCategories = res.data.record;
          return tardySettingsService.periods(vm.settings.schoolsdcid);
        }).then(function(res) {
          vm.settings.periods = res.data.record;
          vm.get();
        });
      }

      function testPrint() {
        var myDate = new Date()
        var slip_date = (myDate.getMonth()+1) + "/" + myDate.getDate() + "/" + myDate.getFullYear()+" "+myDate.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
        window.open('/admin/tardy_kiosk/tardy_slip.html?student_number=42&name=Bobby Tables&teacher=Mrs. Weaver&class=Underwater Basket Weaving&total_tardy_count=10&class_tardy_count=3&header='+vm.settings.header+'&comment='+vm.settings.default_comment+'&footer='+vm.settings.footer+'&code=TU - Tardy Unexcused'+'&date='+slip_date, "tardySlipFrame", "width=350,height=300");
      }

      function clearTempSettings() {
        vm.settings.user = {};
        tardySettingsService.clearTempSettings();
      }

   	}
  });

})();
