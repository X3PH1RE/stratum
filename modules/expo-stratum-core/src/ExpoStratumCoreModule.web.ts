import { registerWebModule, NativeModule } from 'expo';

class ExpoStratumCoreModule extends NativeModule<{}> {}

export default registerWebModule(ExpoStratumCoreModule, 'ExpoStratumCoreModule');
