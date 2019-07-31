var Consts = (function () {
  var Consts = function () {
    this._levels = {
      'camp': {
        'name': 'Extermination',
        'sublevels': [
          '01', '02', '03'
        ]
      },
      'guide': {
        'name': 'Tutorial',
        'sublevels': [
          '01', '02'
        ]
      },
      'hard':{
        'name': 'Main (Hard Mode)',
        'prefix': 'H '
        'sublevels': [
          '05-01', '05-02'
        ]
      },
      'main':{
        'name': 'Main',
        'sublevels': [
          '00-01', '00-02', '00-03', '00-04', '00-05', '00-06', '00-07',
          '00-08', '00-09', '00-10', '00-11', '01-01', '01-02', '01-03',
          '01-04', '01-05', '01-06', '01-07', '01-08', '01-09', '01-10',
          '01-11', '01-12',
        ]
      },
      'promote':{
        'name': 'Event',
        'sublevels': [
          '01', '02', '03'
        ]
      },
      'traning':{
        'name': 'Training',
        'prefix': 'TR ',
        'sublevels': [
          '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
          '13', '14', '15'
        ]
      },
      'weekly':{
        'name': 'Resource',
        'sublevels': [
          '01', '02', '03'
        ]
      }
    }
  };

  return new Consts();
})();
