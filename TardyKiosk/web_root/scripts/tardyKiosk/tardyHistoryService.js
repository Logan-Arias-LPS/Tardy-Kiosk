(function() {
  define(['angular', 'tardyKiosk/tardyModule'], function (angular) {
    angular
    .module('tardyModule')
    .factory('tardyHistoryService', tardyHistoryService);

    tardyHistoryService.$inject = ['$http', '$httpParamSerializer'];
    var PaginationHelper = require('components/widgets/models/PaginationHelper');

    function tardyHistoryService($http, $httpParamSerializer) {
      var service = {
        apply: apply,
        loadData: loadData,
        updateGrid: updateGrid,
        init: init,
        setStudentNumber: setStudentNumber,
        tardyHistory: {
          pgController: '',
          pageOfResults: [],
          school_number: 0,
          student_number: '',
          searchParameters: {
            student_number: ''
          }
        }
      };

      function setStudentNumber(student_number)
      {
        service.tardyHistory.searchParameters.student_number = student_number;
      }

      function init(school_number)
      {
        service.tardyHistory.school_number = school_number;
        service.tardyHistory.pgController = new PaginationHelper(function() {
          service.loadData(service.tardyHistory.pgController, false).then(function(results) {
              service.updateGrid(results);
            }
          )
        });
        service.tardyHistory.pgController.rowsPerPage = 20;
        return service.tardyHistory;
      }


      function apply()
      {
        service.tardyHistory.pgController.pageNumber = 1;
        service.loadData(service.tardyHistory.pgController).then(function(results) {
            service.updateGrid(results);
        });
      }


      function loadData(pgController, loading = true)
      {
        if (loading) {
          loadingDialog('Loading', 'history');
        }

        var order = '';
        if (pgController.getSortColumns().length > 0) {
          order = '&order='+pgController.getSortColumns()+';'+pgController.getSortDirection();
        }

        var payload = {
          schoolid: service.tardyHistory.school_number
        }
        if (service.tardyHistory.searchParameters.student_number.length > 0) { payload.snumber = service.tardyHistory.searchParameters.student_number; }
        return $http.post(
          '/ws/schema/query/com.k12northstar.tardykiosk.history?count=true&page='+pgController.pageNumber+'&pagesize='+pgController.rowsPerPage+order,
           payload
         )
        .then(historyComplete)
        .catch(historyError);

        function historyComplete(response) {
          if (loading) { closeLoading('history'); }
          return response;
        }

        function historyError(error) {
          if (loading) { closeLoading('history'); }
          return Promise.reject(error)
        }
      }

       function updateGrid(results) {
          var pgController = service.tardyHistory.pgController;
          pgController.numberOfRows = results.data.count;
          pgController.updateNumberOfPages();
          pgController.updatePaginationNumbers();
          service.tardyHistory.pageOfResults = results.data.record;
      };

      return service;
    }

  });
})();
