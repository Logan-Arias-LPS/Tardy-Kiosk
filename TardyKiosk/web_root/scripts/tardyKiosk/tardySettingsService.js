(function() {
  define(['angular', 'tardyKiosk/tardyModule'], function (angular) {
    angular
    .module('tardyModule')
    .factory('tardySettingsService', tardySettingsService);

    tardySettingsService.$inject = ['$http', '$httpParamSerializer'];

    function tardySettingsService($http, $httpParamSerializer) {

      var self = this;

      var service = {
        get: get,
        save: save,
        retrieve: retrieve,
        attendanceCodes: attendanceCodes,
        setAttendanceCodeDef: setAttendanceCodeDef,
        attendanceCategories: attendanceCategories,
        clearTempSettings: clearTempSettings,
        periods: periods

      };

      self.recordExists = false;
      self.settings = {}
      self.settings.user = {};

      return service;

      function get(schoolsdcid) {
        if (self.recordExists || !schoolsdcid) {
          return self.settings
        } else {
          return retrieve(schoolsdcid).then(function(res) {
            if (res.data.record.length > 0) {
              self.recordExists = true;
              self.settings = angular.extend(self.settings, res.data.record[0].tables.u_tardies_settings);
              self.settings.schoolsdcid = schoolsdcid;
              if (self.settings.existing_attendance_warning == 'true') { self.settings.existing_attendance_warning = true; } else { self.settings.existing_attendance_warning = false; }
              if (self.settings.disable_comment == 'true') { self.settings.disable_comment = true; } else { self.settings.disable_comment = false; }
              if (self.settings.slip_disable_comment == 'true') { self.settings.slip_disable_comment = true; } else { self.settings.slip_disable_comment = false; }
              service.setAttendanceCodeDef();
            } else {
              self.settings = false;
              self.recordExists = false;
            }
            return self.settings;
          });
        }
      }

      function retrieve(schoolsdcid)
      {
        var url = "/ws/schema/table/U_TARDIES_SETTINGS?q=schoolsdcid=="+schoolsdcid+"&projection=*";

        var payload = {
        };
        return $http.get (
          url,
          payload,
          { headers:{'Content-Type':'application/json'}}
        )
        .then(getComplete)
        .catch(getError);

        function getComplete(response) {
          return response;
        }

        function getError(error) {
          return Promise.reject(error)
        }

      }

      function save(settings) {
        if (!self.recordExists) {
          var url = "/ws/schema/table/U_TARDIES_SETTINGS";

          var payload = {
            tables:{
              u_tardies_settings:{
               schoolsDCID: settings.schoolsdcid,
               id_type: settings.id_type,
               tardy_code: settings.tardy_code,
               late_tardy_code: settings.late_tardy_code,
               tardy_minutes: settings.tardy_minutes,
               late_tardy_minutes: settings.late_tardy_minutes,
               footer: settings.footer,
               header: settings.header,
               default_comment: settings.default_comment,
               total_tardies_by: settings.total_tardies_by,
               tardy_category: settings.tardy_category,
               print_tardy_slip: settings.print_tardy_slip,
               existing_attendance_warning: (settings.existing_attendance_warning) ? '1' : '0',
               disable_comment: (settings.disable_comment) ? '1' : '0',
               period_override: settings.period_override,
               slip_disable_comment: (settings.slip_disable_comment) ? '1' : '0'
             }
           }
          };

          return $http.post (
            url,
            payload,
            { headers:{'Content-Type':'application/json'}}
          )
          .then(saveComplete)
          .catch(saveError);

          function saveComplete(response) {
            self.recordExists = true;
            self.settings = settings;
            service.setAttendanceCodeDef();
            return response;
          }

          function saveError(error) {
            return Promise.reject(error)
          }
        } else {
          var url = "/ws/schema/table/U_TARDIES_SETTINGS/"+settings.schoolsdcid;

          var payload = {
            id: settings.schoolsdcid,
            name: 'u_tardies_settings',
            tables:{
              u_tardies_settings:{
               id_type: settings.id_type,
               tardy_code: settings.tardy_code,
               late_tardy_code: settings.late_tardy_code,
               tardy_minutes: settings.tardy_minutes,
               late_tardy_minutes: settings.late_tardy_minutes,
               footer: settings.footer,
               header: settings.header,
               default_comment: settings.default_comment,
               total_tardies_by: settings.total_tardies_by,
               tardy_category: settings.tardy_category,
               print_tardy_slip: settings.print_tardy_slip,
               existing_attendance_warning: (settings.existing_attendance_warning) ? '1' : '0',
               disable_comment: (settings.disable_comment) ? '1' : '0',
               period_override: settings.period_override,
               slip_disable_comment: (settings.slip_disable_comment) ? '1' : '0'

             }
           }
          };

          return $http.put (
            url,
            payload,
            { headers:{'Content-Type':'application/json'}}
          )
          .then(saveComplete)
          .catch(saveError);

          function saveComplete(response) {
            self.settings = settings;
            service.setAttendanceCodeDef();
            return response;
          }

          function saveError(error) {
            return Promise.reject(error)
          }
        }

      }

      function attendanceCodes(schoolsdcid)
      {
        var url = "/ws/schema/query/com.k12northstar.tardykiosk.attendance_codes";

        var payload = {
          schoolsdcid: schoolsdcid
        };
        return $http.post (
          url,
          payload,
          { headers:{'Content-Type':'application/json'}}
        )
        .then(getComplete)
        .catch(getError);

        function getComplete(response) {
          self.settings.attendanceCodes = response.data.record;
          return response;
        }

        function getError(error) {
          return Promise.reject(error)
        }

      }

      function attendanceCategories(schoolsdcid)
      {
        var url = "/ws/schema/query/com.k12northstar.tardykiosk.attendance_categories";

        var payload = {
          schoolsdcid: schoolsdcid
        };
        return $http.post (
          url,
          payload,
          { headers:{'Content-Type':'application/json'}}
        )
        .then(getComplete)
        .catch(getError);

        function getComplete(response) {
          self.settings.attendanceCategories = response.data.record;
          return response;
        }

        function getError(error) {
          return Promise.reject(error)
        }

      }

      function periods(schoolsdcid)
      {
        var url = "/ws/schema/query/com.k12northstar.tardykiosk.periods";

        var payload = {
          schoolsdcid: schoolsdcid
        };
        return $http.post (
          url,
          payload,
          { headers:{'Content-Type':'application/json'}}
        )
        .then(getComplete)
        .catch(getError);

        function getComplete(response) {
          self.settings.periods = response.data.record;
          return response;
        }

        function getError(error) {
          return Promise.reject(error)
        }

      }



      function setAttendanceCodeDef()
      {
        if (self.settings.tardy_code) {
          self.settings.tardy_code_def = self.settings.attendanceCodes.find(obj => {
            return obj.code == self.settings.tardy_code
          });
        }
        if (self.settings.late_tardy_code) {
          self.settings.late_tardy_code_def = self.settings.attendanceCodes.find(obj => {
            return obj.code == self.settings.late_tardy_code
          });
        }

        if (self.settings.user.tardy_code) {
          self.settings.user.tardy_code_def = self.settings.attendanceCodes.find(obj => {
            return obj.code == self.settings.user.tardy_code
          });
        } else { self.settings.user.tardy_code_def = ''; }
        if (self.settings.user.late_tardy_code) {
          self.settings.user.late_tardy_code_def = self.settings.attendanceCodes.find(obj => {
            return obj.code == self.settings.user.late_tardy_code
          });
        } else { self.settings.user.late_tardy_code_def = ''; }

      }

      function clearTempSettings()
      {
        self.settings.user = {};
        self.setAttendanceCodeDef();
      }

    }

  });
})();
