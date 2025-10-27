(function() {

  define(['angular', 'tardyKiosk/tardyModule', 'tardyKiosk/tardyHistoryService'], function (angular) {
    angular
    .module('tardyModule')
    .controller('tardyHistoryController', tardyHistoryController);

    tardyHistoryController.$inject = ['tardyHistoryService', 'tardySettingsService', '$scope', '$q', '$httpParamSerializer'];

    function tardyHistoryController(tardyHistoryService, tardySettingsService, $scope, $q, $filter) {
      var vm = this;

      vm.apply = apply;
      vm.init = init;
      vm.printHistory = printHistory;


      $scope.$watch('vm.tardyHistory.searchParameters.student_number', function(current, original) {
          tardyHistoryService.setStudentNumber(current);
       });


      function init(school_number) {
        vm.tardyHistory = tardyHistoryService.init(school_number);
        vm.apply();
      };

      function getSettings()
      {
        var settings = tardySettingsService.get();
        return $q.when(tardySettingsService.get());
      }

      function printHistory(item) {
        getSettings()
        .then(function(settings) {
          window.open('/admin/tardy_kiosk/tardy_slip.html?student_number='+item.student_number+'&sid='+item.studentid+'&name='+item.first_name+' '+item.last_name+'&teacher='+item.teacher_first+' '+item.teacher_last+'&class='+item.course_name+' '+item.expression+'&class_tardy_count='+item.class_tardy_count+'&total_tardy_count='+item.total_tardy_count+'&comment='+((item.comment) ? item.comment : '')+'&footer='+((settings.footer != null) ? settings.footer : '')+'&header='+((settings.header != null) ? settings.header : '')+'&code='+item.att_code+' - '+item.att_description+'&date='+item.dateentered, "tardySlipFrame", "width=350,height=300");
        })
      }

      function apply()
      {
        tardyHistoryService.apply();
      }

   	}
});
})();
