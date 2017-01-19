import {alchemicals} from './Enums.js'
import _ from 'lodash'

function worldGenerator(golemMode) {
  const mainWorlds = permutator(_.keys(alchemicals))
  if (golemMode) {
    const golemWorlds = golemWorldGenerator()
    return _.flatMap(mainWorlds, (mainWorld) =>
      _.map(golemWorlds, (golemWorld) =>
        ({ingAlcMap: mainWorld, golemMap: golemWorld, multiplicity: 1})
      )
    )
  } else {
    return mainWorlds.map((world) => ({ingAlcMap: world, multiplicity: 1}))
  }
}

// http://stackoverflow.com/a/20871714/6036628
function permutator(inputArr) {
  let results = []

  function permute(arr, memo) {
    let cur = memo

    for (let i = 0; i < arr.length; i++) {
      cur = arr.splice(i, 1)
      if (arr.length === 0) {
        results.push(memo.concat(cur))
      }
      permute(arr.slice(), memo.concat(cur))
      arr.splice(i, 0, cur[0])
    }

    return results
  }

  return permute(inputArr, [])
}

// a golem world looks like:
// [{affects: 'ears', size: -1}, 'nothing', {affects: 'chest', size: 1}]
function golemWorldGenerator() {
  const affects = ['ears', 'chest', 'nothing']
  return _.flatMap(permutator(affects), (world) =>
    _.flatMap(_.values([-1,1]), (size1) =>
      _.map(_.values([-1,1]), (size2) => {
        const earsIndex = _.findIndex(world, (value) => value === 'ears')
        world[earsIndex] = {affects: 'ears', size: size1}
        const chestIndex = _.findIndex(world, (value) => value === 'chest')
        world[chestIndex] = {affects: 'chest', size: size2}
        return world
      })
    )
  )
}

export {worldGenerator}
