'use strict';

angular.module('fsaApp')
  .controller('TeacherCtrl', function ($scope, Auth, $http, ngDialog, toastr, $location, classroomHelper) {
    $scope.newMessage = undefined;
    $scope.messages = [];
    $scope.classrooms = [];
    $scope.assignments = [];

    var setUpClassrooms = function (classrooms) {
      $scope.classrooms = classrooms;
      var announcements = [];
      for (var i = 0; i < classrooms.length; i++) {
        for (var j = 0; j < classrooms[i].messages.length; j++) {
          if (classrooms[i].messages[j].type === 'announcement'){
            if (announcements.indexOf(classrooms[i].messages[j].message) === -1) {
              $scope.messages.push(classrooms[i].messages[j]);
              announcements.push(classrooms[i].messages[j].message);
            }
          }
        }
      }
    };

    /*
    Searches for locally stored classrooms. Otherwise gets classrooms from server
    */
    var localTeacherClassrooms = classroomHelper.getTeacherClassrooms();
    // cutoff is 1 because sometimes an individual classroom may be stored if teacher refreshes the classroom page 
    if (localTeacherClassrooms.length <= 1) {
      $http.get('/api/classrooms/byTeacher')
        .success(function(classroomsFromServer) {
          classroomHelper.storeTeacherClassrooms(classroomsFromServer);
          setUpClassrooms(classroomsFromServer);
        }).error(function(err) {
          toastr.error(err);
        });
    } else {
      setUpClassrooms(localTeacherClassrooms);
    }

    /*
    Searches for locally stored assignment. Otherwise gets assignment from server
    */ 
    var localTeacherAssignments = classroomHelper.getTeacherAssignments();
    if (localTeacherAssignments.length === 0) {
      $http.get('/api/assignments/byAuthor')
        .success(function(assignments) {
          classroomHelper.storeTeacherAssignments(assignments);
          $scope.assignments = assignments;
        }).error(function(err) {
          toastr.error(err);
        });
    } else {
      $scope.assignments = localTeacherAssignments;
    }

    $scope.addMessage = function() {
      if ($scope.newMessage && $scope.newMessage !== '') {
        var message = {
          message: $scope.newMessage,
          type: 'announcement',
          date: new Date(Date.now())
        };

        $http.post('/api/classrooms/announcement', message)
          .success(function(data){
            data.isToday = $scope.checkIfToday(data.date);
            $scope.messages.push(data);
            $scope.newMessage = undefined;
            $scope.$broadcast('messages_updated');
          }).error(function(err){
            toastr.error(err);
          });
      }
    };

    $scope.checkIfToday = function(dateThing) {
      var today = new Date(Date.now());
      var dateObj = new Date(dateThing);
      return dateObj.toDateString() === today.toDateString();
    };

    $scope.goToClass = function(activeClass) {
      $location.path(encodeURI('teacher/classroom/' + activeClass.code));
    };

    $scope.addClassModal = function() {
      var newClass = ngDialog.open({
        template: 'app/teacher/addClassModal.html',
        scope: $scope,
        className: 'mdModal',
        controller: 'TeacherAddClassCtrl'
      });

      newClass.closePromise.then(function(data) {
        if ((data.value) && (data.value !== '$document') && (data.value !== '$escape')) {
          $scope.classrooms.push(data.value);
        }
      });
    };

    $scope.addAssignmentModal = function(assignment) {
      var newAssignment = ngDialog.open({
        template: 'app/teacher/addAssignmentModal.html',
        controller: 'TeacherAddAssignmentCtrl',
        className: 'lgModal',
        data: {
          assignment: assignment
        }
      });
      newAssignment.closePromise.then(function(data) {
        console.log("data passed when new assignment modal is closed");
        console.log(data);
        if ((data.value) && (data.value !== '$document') && (data.value !== '$escape')) {
          $scope.assignments.push(data.value);
        }
      });
    };

    $scope.assignAssignment = function(assignment) {
      var administer = ngDialog.open({
        template: 'app/teacher/administerAssignmentModal.html',
        controller: 'TeacherAdministerAssigmentCtrl',
        data: {
          classrooms: $scope.classrooms,
          assignment: assignment
        },
        className: 'mdModal'
      });

      administer.closePromise.then(function(data) {
        console.log("data passed after assign modal is closed")
        console.log(data);
        if ((data.value) && ((data.value !== '$document') && (data.value !== '$escape'))) {
          toastr.success('Assigment administered!', {
            timeOut: 1000
          });
        }
      });
    };

    $scope.deleteClassroom = function(objectId, i) {
      var toDelete = ngDialog.open({
        template: 'components/confirmModal/confirmModal.html',
        controller: 'ConfirmModalCtrl',
        data: {
          title: 'Confirm Deletion',
          body: 'Are you sure you want to delete this classroom?'
        }
      });
      toDelete.closePromise.then(function(data) {
        if (data.value === true) {
          $http.delete('api/classrooms/' + classId)
            .success(function() {
              $scope.classrooms.splice(i, 1);
            }).error(function(err) {
              toastr.error(err);
            });
        }
      });
    };

    $scope.editAssignment = function (assignmentObject) {
      console.log(assignmentObject);
      
    };

    $scope.deleteAssignment = function (assignmentObject) {
      console.log(assignmentObject);
    };
  });
