#include <vector>
#include <string>
#include <emscripten/bind.h>
#include "headers/multifilespikereader.hpp"

using namespace emscripten;


EMSCRIPTEN_BINDINGS(multiReaderBindings) {
    register_vector<std::string>("VectorString");
    class_<MultifileSpikeReader>("MultifileSpikeReader")
        .constructor<std::vector<std::string>, val>()
        .function("start", &MultifileSpikeReader::start)
        .function("stop", &MultifileSpikeReader::stop)
        .function("wait", &MultifileSpikeReader::wait)
        .function("isRunning", &MultifileSpikeReader::isRunning)
        .function("drainSpikes", &MultifileSpikeReader::drainSpikes);
}