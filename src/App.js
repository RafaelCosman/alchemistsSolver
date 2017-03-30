// === UI stuff ===
//TODO add refresh indicators http://www.material-ui.com/#/components/refresh-indicator
//TODO downsize columns (and rows)

// === Refactoring ===
//TODO split up FactDialogs.js

// === Other stuff ===
//TODO make Facts into React Components
//TODO fix lag issues
//TODO get test file working
//TODO (periodically?) filter package.json unneeded packages

import {showExpansionDialog} from './ExpansionSelectorDialog.js'
import {AddTwoIngredientFactDialog, AddOneIngredientFactDialog, AddLibraryFactDialog, AddGolemTestFactDialog, AddGolemAnimationFactDialog, AddRivalPublicationDialog} from './FactDialogs.js'
import {PublishView} from './PublishView.js'
import {EncyclopediaView} from './EncyclopediaView.js'
import {OptimizerView} from './OptimizerView.js'
import {showAboutDialog} from './AboutDialog.js'
import {showHelpDialog} from './HelpDialog.js'
import {worldGenerator} from './WorldGenerator.js'
import './App.css'

import Tabs from 'antd/lib/tabs';
import Switch from 'antd/lib/switch';
import Button from 'antd/lib/button';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'

import enUS from 'antd/lib/locale-provider/en_US';
import LocaleProvider from 'antd/lib/locale-provider'

import _ from 'lodash'

import React from 'react'
import {View} from 'react-native'
import injectTapEventPlugin from 'react-tap-event-plugin'
injectTapEventPlugin()


const TabPane = Tabs.TabPane;

const style = {
  margin: 12,
}

function worldWeight(world) {
  return world.multiplicity * world.golemMaps.length
}

class AlchemistsSolverApp extends React.PureComponent {
  state = {
    expansionGolem: false,
    expansionLibrary: false,
    expansionEncyclopedia: false,
    factlist: [],
  }
  handleSubmit = (newFact) => {
    this.setState({
      factlist: this.state.factlist.concat([newFact]),
    })
  }
  componentDidMount() {
    //The about dialog is the first you see since it's the last to appear
    showExpansionDialog(() => this.setState({
      expansionGolem: true,
      expansionLibrary: true,
      expansionEncyclopedia: true,}
    ))
    showAboutDialog()
  }
  render() {
    let worlds = worldGenerator(this.state.expansionGolem)

    _.forEach(this.state.factlist, (fact) => {
      _.forEach(worlds, fact.updatePrior)
      worlds = _.filter(worlds, (world) => worldWeight(world) !== 0)
    })

    let factDialogs = [
      <AddTwoIngredientFactDialog handleSubmit={this.handleSubmit} key="TwoIng"/>,
      <AddOneIngredientFactDialog handleSubmit={this.handleSubmit} key="OneIng"/>,
      <AddRivalPublicationDialog handleSubmit={this.handleSubmit} key="Rival"/>,
    ]
    if (this.state.expansionLibrary) {
      factDialogs.push(<AddLibraryFactDialog handleSubmit={this.handleSubmit} key="Library"/>)
    }
    if (this.state.expansionGolem) {
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
      let expansionPublishViews = []
      if (this.state.expansionEncyclopedia) {
        expansionPublishViews.push(<EncyclopediaView worlds={worlds} key="Encyclopedia"/>)
      }
      views = <Tabs>
        <Tabs.TabPane tab="Publishing" key="Publishing">
          <PublishView worlds={worlds} />
          {expansionPublishViews}
        </Tabs.TabPane>
        <Tabs.TabPane tab="Experiment Optimizer" key="Experiment Optimizer">
          <OptimizerView worlds={worlds} encyclopedia={this.state.expansionEncyclopedia}/>
        </Tabs.TabPane>
      </Tabs>
    }

    let switches = []
    if (this.state.expansionLibrary) { //TODO: more reasonable condition for expansion mode
      switches.push(<Switch
        checkedChildren="Encyclopedia enabled"
        unCheckedChildren="Encyclopedia disabled"
        checked={this.state.expansionEncyclopedia}
        onChange={(checked) => this.setState({expansionEncyclopedia: checked})}
        key="toggleEncyclopedia"
      />)
    }

    return (
      <LocaleProvider locale={enUS}>
        <MuiThemeProvider>
          <div>
            <Button onClick={showHelpDialog}>Help</Button>
            <Button onClick={showAboutDialog}>About</Button>
            <ul>
              {this.state.factlist.map((fact, factIndex) => <ReactFact key={factIndex} item={fact.render()} deleteFact={() => {this.deleteFact(factIndex)}} />)}
            </ul>
            {factDialogs}
            {switches}
            {views}
          </div>
        </MuiThemeProvider>
      </LocaleProvider>
    )
  }
  deleteFact = (deleteIndex) => {
    this.setState({factlist: removeAtIndex(this.state.factlist, deleteIndex)})
  }
}

function ReactFact(props) {
  return <li>
    <View style={{flexDirection:'row', flexWrap:'wrap'}}>
      {props.item}
      <Button onClick={props.deleteFact} style={style}>Delete</Button>
    </View>
  </li>
}

// non-mutating
function removeAtIndex(arr, index) {
  return _.filter(arr, function(val, idx) {return idx !== index})
}

export default AlchemistsSolverApp
export {worldWeight}
