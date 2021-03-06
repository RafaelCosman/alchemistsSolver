// === UI stuff ===
//TODO add refresh indicators
//TODO downsize columns (and rows)

// === Refactoring ===

// === Other stuff ===
//TODO make Facts into React Components
//TODO get test file working
//TODO (periodically?) filter package.json unneeded packages

import {showExpansionDialog} from './ExpansionSelectorDialog.js'
import {AddTwoIngredientFactDialog, AddOneIngredientFactDialog,
  AddLibraryFactDialog, AddGolemTestFactDialog, AddGolemAnimationFactDialog,
  AddRivalPublicationDialog} from './FactDialogs.js'
import {PublishView} from './PublishView.js'
import {EncyclopediaView} from './EncyclopediaView.js'
import {GolemView} from './GolemView.js'
import {Explorer} from './Explorer.js'
import {OptimizerView} from './OptimizerView.js'
import {ExhibitionView} from './ExhibitionView.js'
import {showAboutDialog} from './AboutDialog.js'
import {showHelpDialog} from './HelpDialog.js'
import {showExportDialog, deserializeFact} from './ImportExport.js'
import {worldGenerator} from './WorldGenerator.js'
import {worldWeight} from './Logic.js'
import {styles} from './MyIcon.js'

import Tabs from 'antd/lib/tabs'
import Slider from 'antd/lib/slider'
import Button from 'antd/lib/button'

import enUS from 'antd/lib/locale-provider/en_US'
import ConfigProvider from 'antd/lib/config-provider'

import _ from 'lodash'

import React from 'react'
import {View} from 'react-native'
import {useLocation, BrowserRouter} from 'react-router-dom'


const EXP_NONE = -1
const EXP_LIBRARY = 0
const EXP_ENCYCLOPEDIA = 1
const EXP_GOLEM = 2

const style = {
  margin: 12,
}

function TopLevel() {
  return <BrowserRouter>
    <URLParser/>
  </BrowserRouter>
}

function URLParser() {
  let query = new URLSearchParams(useLocation().search);

  let expansion = query.get("expansion")

  let vals = []
  let idx = 0
  let val, type
  while (true) {
    val = query.get("fact"+idx)
    if (val === null) {
      return <AlchemistsSolverApp factsSeed={vals} expansionSeed={expansion}/>
    }
    type = query.get("type"+idx)
    vals.push([type, val])
    idx += 1
  }
}

class AlchemistsSolverApp extends React.PureComponent {
  constructor(props) {
    super(props)
    if (this.props.factsSeed.length === 0 && this.props.expansionSeed === null) {
      this.state = {
        expansion: EXP_NONE,
        factlist: [],
      }
      // The about dialog is the first you see since it's the last to appear
      showExpansionDialog(() => this.setState({expansion: EXP_GOLEM}))
      showAboutDialog()
    } else {
      this.state = {
        expansion: +this.props.expansionSeed,
        factlist: _.map(this.props.factsSeed, deserializeFact)
      }
    }
  }

  handleSubmit = (newFact) => {
    this.setState({
      factlist: this.state.factlist.concat([newFact]),
    })
  }

  render() {
    let worlds = worldGenerator(this.state.expansion === EXP_GOLEM)

    _.forEach(this.state.factlist, (fact) => {
      _.forEach(worlds, fact.updatePrior)
      worlds = _.filter(worlds, (world) => worldWeight(world) !== 0)
    })

    let factDialogs = [
      <AddTwoIngredientFactDialog handleSubmit={this.handleSubmit} key="TwoIng"/>,
      <AddOneIngredientFactDialog handleSubmit={this.handleSubmit} key="OneIng"/>,
      <AddRivalPublicationDialog handleSubmit={this.handleSubmit} key="Rival"/>,
    ]
    if (this.state.expansion >= EXP_LIBRARY) {
      factDialogs.push(<AddLibraryFactDialog handleSubmit={this.handleSubmit} key="Library"/>)
    }
    if (this.state.expansion >= EXP_GOLEM) {
      factDialogs.push(<AddGolemTestFactDialog handleSubmit={this.handleSubmit} key="GolemTest"/>)
      factDialogs.push(<AddGolemAnimationFactDialog handleSubmit={this.handleSubmit} key="GolemAnimation"/>)
    }

    let views
    if (worlds.length === 0) {
      views = <div>
        <h1>Your facts are contradictory.</h1>
        Check them and delete any you may have entered incorrectly, or read the
        Help section to make sure you know the format and meaning of the facts.
      </div>
    } else {
      let studiedIngredients = new Set()
      if (this.state.expansion !== EXP_GOLEM) {
        _.forEach(this.state.factlist, fact => {
          _.forEach(fact.mentionedIngredients(), ing => {
            studiedIngredients.add(ing)
          })
        })
      }
      let publishViews = [worlds =>
        <PublishView
          worlds={worlds}
          key="Journal"
          expansionReorder={this.state.expansion !== EXP_NONE}
        />
      ]
      if (this.state.expansion >= EXP_ENCYCLOPEDIA) {
        publishViews.push(worlds => <EncyclopediaView worlds={worlds} key="Encyclopedia"/>)
      }
      if (this.state.expansion >= EXP_GOLEM) {
        publishViews.push(worlds => <GolemView worlds={worlds} key="Golem"/>)
      }
      views = <Tabs>
        <Tabs.TabPane tab="Publishing" key="Publishing">
          <Explorer publishViews={publishViews} worlds={worlds} golem={this.state.expansion === EXP_GOLEM} studiedIngredients={studiedIngredients}/>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Experiment Optimizer" key="Experiment Optimizer">
          <OptimizerView worlds={worlds} encyclopedia={this.state.expansion >= EXP_ENCYCLOPEDIA} golem={this.state.expansion === EXP_GOLEM}/>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Exhibition (Beta)" key="Exhibition Optimizer">
          <ExhibitionView worlds={worlds}/>
        </Tabs.TabPane>
      </Tabs>
    }

    let switches = []
    if (this.state.expansion !== EXP_NONE) {
      const marks = {
        0: 'Library', // EXP_LIBRARY
        1: '+Encyclopedia', // EXP_ENCYCLOPEDIA
        2: '+Golem', // EXP_GOLEM
      }
      switches.push(
        <div style={{marginLeft: 30, marginRight: 30}} key="expansionSlider">
          <Slider
            min={EXP_LIBRARY}
            max={EXP_GOLEM}
            marks={marks}
            step={null}
            value={this.state.expansion}
            onChange={(value) => this.setState({expansion: value})}
            tipFormatter={null}
          />
        </div>
      )
    }

    return <ConfigProvider locale={enUS}>
      <View onLayout={styles.onLayout(() => this.forceUpdate())}>
        <div>
          <Button onClick={showHelpDialog}>Help</Button>
          <Button onClick={showAboutDialog}>About</Button>
          <Button onClick={() => showExportDialog(this.state.expansion, this.state.factlist)}>Export</Button>
        </div>
        <div>
          {this.state.factlist.map((fact, factIndex) =>
            <ReactFact
              key={factIndex}
              item={fact.render()}
              deleteFact={() => {this.deleteFact(factIndex)}}
            />
          )}
        </div>
        {factDialogs}
        {switches}
        {views}
      </View>
    </ConfigProvider>
  }
  deleteFact = (deleteIndex) => {
    this.setState({factlist: removeAtIndex(this.state.factlist, deleteIndex)})
  }
}

function ReactFact({item, deleteFact}) {
  return <View style={{flexDirection:'row', flexWrap:'wrap'}}>
    {item}
    <Button onClick={deleteFact} style={style}>Delete</Button>
  </View>
}

// non-mutating
function removeAtIndex(arr, index) {
  return _.filter(arr, (val, idx) => idx !== index)
}

export default TopLevel
