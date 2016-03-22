'use strict';

angular.module('fsaApp')
  .controller('TeacherAssignmentCtrl', function ($scope, ngDialog, $http, $location, $routeParams, toastr, classroomHelper, filterFilter, Auth) {
    $scope.showAssignmentQuestions = true;
    $scope.lim = 5;
    $scope.currrentPage = 1;
    $scope.maxPage = 1;
    $scope.me = '';

    Auth.getCurrentUserAsync(function(user) {
      if (user) {
        $scope.me = user._id;
      }
    });

    //Changes the page of the questions.
    $scope.page = function(step) {
      var newPage = $scope.currentPage + step;
      if ((newPage < 1 ) || (newPage > $scope.maxPage)) {
        return;
      }
      else {
        $scope.currentPage = newPage;
      }
    };

    $scope.setFiltered = function() {
      $scope.filteredAlternativeQuestions = $scope.alternativeQuestions;
      if ($scope.filteredAlternativeQuestions) {
        var filterLen = $scope.filteredAlternativeQuestions.length;
        if (filterLen > 0) {
          $scope.maxPage = Math.ceil(filterLen/$scope.lim);
        }
        else {
          $scope.maxPage = 1;
        }
      }
    };

    $scope.updateFiltered = function() {
      var filt = {};
      filt.$ = $scope.searchText;
      $scope.filteredAlternativeQuestions = filterFilter($scope.alternativeQuestions, filt);
    };

    var TAStoredAssignment = classroomHelper.getNewAssignment();
    if (TAStoredAssignment) {
      $scope.newAssignment = {
        name: TAStoredAssignment.name,
        subject: TAStoredAssignment.subject,
        questions: []
      };
    } else {
      $location.path('/teacher');
    }

    // add if statement here to check if assignments are stored in a service
    $http.get('/api/questions/bySubject/' + $scope.newAssignment.subject.dbName)
      .success(function(questions) {
        // store questions in service
        $scope.alternativeQuestions = questions;
        $scope.setFiltered();
        if (TAStoredAssignment.topic) {
          $scope.searchText = TAStoredAssignment.topic;
          $scope.updateFiltered();
          // pre-poplulate exam
          $scope.newAssignment.questions = $scope.filteredAlternativeQuestions.splice(0, TAStoredAssignment.questionNumber);
          pruneFromAll();
        }
      }).error(function(err){
        toastr.error(err);
      });

      $scope.$watch('filteredAlternativeQuestions', function(filteredAlternativeQuestions) {
        if (filteredAlternativeQuestions) {
          var filterLen = filteredAlternativeQuestions.length;
          if (filterLen > 0) {
            $scope.maxPage = Math.ceil(filterLen/$scope.lim);
          }
          else {
            $scope.maxPage = 1;
          }
          $scope.currentPage = 1;
        }
      });

    $scope.sides = [
      'Left',
      'Right'
    ];

    $scope.questionTypes = [
      {
        'name': 'Multiple Choice',
        'value': 'mult'
      },
      {
        'name': 'Short Answer',
        'value': 'short'
      },
      {
        'name': 'Long Answer',
        'value': 'long'
      }
    ];

    $scope.vote = function(question, voteType, i) {
      // only logged-in users can vote.
      if ($scope.me) {
        $http.put('api/questions/vote/' + question._id, {type: voteType})
          .success(function(newQuestion) {
            $scope.filteredAlternativeQuestions[i] = newQuestion;
          }).error(function(error) {
            toastr.error(error);
          });
      }
    };

    $scope.delQuestion = function(index) {
      if (!$scope.newAssignment.questions[index].isLocal) {
        $scope.alternativeQuestions.push($scope.newAssignment.questions[index]);
      }
      $scope.newAssignment.questions.splice(index, 1);
    };

    $scope.addQuestion = function(index) {
      var actualIndex = index + ($scope.currentPage - 1) * $scope.lim;
      $scope.newAssignment.questions.push($scope.filteredAlternativeQuestions[actualIndex]);
      $scope.filteredAlternativeQuestions.splice(actualIndex, 1);
      pruneFromAll();
      toastr.success('Question added!', {
        timeOut: 1000
      });
    };

    var pruneFromAll = function() {
      var usedIds = [];
      for (var x = 0; x < $scope.newAssignment.questions.length; x++ ){
        usedIds.push($scope.newAssignment.questions[x]._id);
      }
      for (var i = $scope.alternativeQuestions.length-1; i >= 0; i--) {
        if (usedIds.indexOf($scope.alternativeQuestions[i]._id) > -1) {
          $scope.alternativeQuestions.splice(i, 1);
        }
      }
    }

    $scope.confirmAssignment = function(assignment) {
      var newAssignment = {
        name: assignment.name,
        questions: [],
        subject: assignment.subject,
        tags: []
      };
      for (var i = 0; i < assignment.questions.length; i++) {
        newAssignment.questions.push(assignment.questions[i]._id);
        newAssignment.tags = newAssignment.tags.concat(assignment.questions[i].tags);
      }
      if ($scope.me) {
        $http.put('/api/assignments/' + $routeParams.assignmentCode, newAssignment)
          .success(function(assignmentFromServer){
            console.log(assignmentFromServer);
            classroomHelper.setNewAssignment(undefined);
            $location.path('/teacher');
          }).error(function(e){
            toastr.error(e, {timeOut: 1000});
          });
        } else {
          $http.post('/api/assignments/nonUser', newAssignment)
            .success(function(assignment) {
              // testing something - if user being authenticated makes a difference in which assignment is pulled up
              classroomHelper.setNewAssignment(assignment);
              $location.path('/teacher/sampleAssignment');
            }).error(function(e){
              toastr.error(e, {timeOut: 1000});
            });
        }
    };

    $scope.addNew = function() {
      $scope.addingQuestion = true;
    };

    $scope.scrapNew = function() {
      $scope.newLocalQuestion = {
        type: $scope.questionTypes[0].value,
        tagString: '',
        isLocal: true,
        pointValue: 1,
        body: '',
        subject: $scope.newAssignment.subject.dbName,
        explanation: {
          body: ''
        },
        choices: [
          {
            body: '',
            correct: false
          },
          {
            body: '',
            correct: false
          },
          {
            body: '',
            correct: false
          },
          {
            body: '',
            correct: false
          }
        ]
      };
      $scope.addingQuestion = false;
    };

    $scope.scrapNew();


    $scope.getTags = function(q) {
      if (!q.tagString) {
        return [];
      }
      var tags = q.tagString.split(',');
      var cleanTags = [];
      for (var i = 0; i < tags.length; i++) {
        tags[i] = tags[i].trim();
        if (tags[i] !== '') {
          cleanTags.push(tags[i]);
        }
      }
      return cleanTags;
    };


    $scope.saveNewQuestion = function(newQuestion) {
      if (newQuestion.tagString) {
        newQuestion.tags = $scope.getTags(newQuestion);
      } else {
        return toastr.error('Please enter at least one tag.', {
          timeOut: 1000
        });
      }

      // Replace textarea line breaks with HTML breaks
      console.log(newQuestion);
      // Add question to assignment and also question bank
      $http.post('/api/questions/mine', newQuestion)
        .success(function(q) {
          $scope.newAssignment.questions.push(q);
          $scope.scrapNew();
        }).error(function(err) {
          toastr.error(err);
        });
    };

    $scope.saveQuestion = function(question, n) {
      if (question.type === 'mult') {
        for (var i = 0; i < question.choices.length; i++) {
          question.choices[i].correct = question.choices[i].tempCorrect;
        }
      }
      if (question.tagString) {
        question.tags = $scope.getTags(question);
      } else {
        return toastr.error('Please enter at least one tag.', {
          timeOut: 1000
        });
      }
      $http.put('api/questions/mine/' + question._id, question)
        .success(function(q) {
          $scope.newAssignment.questions[n] = q;
          $scope.newAssignment.questions[n].editing = false;
        }).error(function(err) {
          toastr.error(err);
        });
    };
  });
